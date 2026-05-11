/**
 * ST Lab PTP Domain Tracing Engine
 *
 * Algorithm: BFS from each GrandmasterClock on PTP-plane links only.
 * Sources: research/report-ptp.md
 *
 * Violation confidence levels:
 * - RFC 7273 / RFC 3550 backed: error severity
 * - IEEE 1588-2019 metadata + secondary: warning severity (clause text unverified)
 */
import { db } from '../db/connection.js';
import { nodes, links, violations, derivedMetrics } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
/**
 * Build adjacency map for PTP-plane links only.
 * BFS is bidirectional — PTP sync flows both directions.
 */
function buildPtpAdjacency(ptpLinks) {
    const adj = new Map();
    for (const link of ptpLinks) {
        if (!adj.has(link.sourceNodeId))
            adj.set(link.sourceNodeId, []);
        if (!adj.has(link.targetNodeId))
            adj.set(link.targetNodeId, []);
        adj.get(link.sourceNodeId).push(link.targetNodeId);
        adj.get(link.targetNodeId).push(link.sourceNodeId);
    }
    return adj;
}
/**
 * Get PTP domain number from a link's properties (if declared).
 */
function getLinkPtpDomain(linkProps) {
    const p = linkProps;
    return typeof p['ptpDomainNumber'] === 'number' ? p['ptpDomainNumber'] : undefined;
}
/**
 * Trace PTP domains across the design graph via BFS from each Grandmaster.
 * Source: research/report-ptp.md — Engineering Timing Model + BFS reachability
 */
export async function tracePtpDomains(projectId) {
    const allNodes = await db.query.nodes.findMany({ where: eq(nodes.projectId, projectId) });
    const allLinks = await db.query.links.findMany({ where: eq(links.projectId, projectId) });
    // Filter to PTP-plane links only (enforces plane isolation — project brief §7.2)
    const ptpLinks = allLinks.filter((l) => l.networkPlane === 'ptp');
    const grandmasters = allNodes.filter((n) => n.nodeType === 'grandmaster_clock');
    const switchNodes = allNodes.filter((n) => ['dedicated_switch', 'shared_switch'].includes(n.nodeType));
    const adj = buildPtpAdjacency(ptpLinks);
    const engineViolations = [];
    const domains = [];
    // Track global reachability (all nodes reached from any GM)
    const globalReachable = new Set();
    // BFS from each Grandmaster Clock
    for (const gm of grandmasters) {
        const props = gm.properties;
        const domainNumber = props['domainNumber'] ?? 127;
        const gmPtpLinks = ptpLinks.filter((l) => l.sourceNodeId === gm.id || l.targetNodeId === gm.id);
        if (gmPtpLinks.length === 0) {
            // Grandmaster exists but has no PTP-plane links
            engineViolations.push({
                type: 'PTP_GRANDMASTER_ISOLATED',
                severity: 'warning',
                entityId: gm.id,
                message: `Grandmaster "${gm.label}" has no PTP-plane links. Verify PTP timing distribution is modeled correctly.`,
                detail: { domainNumber },
            });
            continue;
        }
        const reachable = new Set();
        const queue = [gm.id];
        while (queue.length > 0) {
            const nodeId = queue.shift();
            if (reachable.has(nodeId))
                continue;
            reachable.add(nodeId);
            globalReachable.add(nodeId);
            const node = allNodes.find((n) => n.id === nodeId);
            if (!node)
                continue;
            // Check switch clock mode (IEEE 1588-2019 device roles — secondary guidance → warning)
            if (['dedicated_switch', 'shared_switch'].includes(node.nodeType)) {
                const nodeProps = node.properties;
                const clockMode = nodeProps['ptpClockMode'];
                if (!clockMode) {
                    engineViolations.push({
                        type: 'PTP_SWITCH_NO_CLOCK_MODE',
                        severity: 'warning',
                        entityId: node.id,
                        message: `Switch "${node.label}" is on a PTP-plane path but has no Boundary/Transparent clock mode declared. IEEE 1588-2019 clause requirements are Unverified — treat as design guidance.`,
                        detail: { domainNumber },
                    });
                }
            }
            // Traverse PTP neighbors
            for (const neighborId of adj.get(nodeId) ?? []) {
                // Check domain consistency on traversed link
                const traversedLink = ptpLinks.find((l) => (l.sourceNodeId === nodeId && l.targetNodeId === neighborId) ||
                    (l.sourceNodeId === neighborId && l.targetNodeId === nodeId));
                if (traversedLink) {
                    const linkDomain = getLinkPtpDomain(traversedLink.properties);
                    if (linkDomain !== undefined && linkDomain !== domainNumber) {
                        // RFC 7273 §4.8: traceable/non-traceable must not mix; domain conflict
                        engineViolations.push({
                            type: 'PTP_DOMAIN_CONFLICT',
                            severity: 'error',
                            entityId: traversedLink.id,
                            message: `PTP domain conflict on link: GM domain ${domainNumber} conflicts with link-declared domain ${linkDomain}. Source: RFC 7273 §4.8.`,
                            detail: { gmDomain: domainNumber, linkDomain, linkId: traversedLink.id },
                        });
                        continue; // Do not traverse into conflicting domain
                    }
                }
                queue.push(neighborId);
            }
        }
        domains.push({
            domainNumber,
            grandmasterId: gm.id,
            grandmasterLabel: gm.label,
            reachableNodeIds: [...reachable],
        });
    }
    // Check: any node on a PTP-plane link NOT reachable from any GM
    // Source: RFC 7273 §4.3 — GM ClockIdentity required for timing equivalence
    const allPtpNodeIds = new Set(ptpLinks.flatMap((l) => [l.sourceNodeId, l.targetNodeId]));
    for (const nodeId of allPtpNodeIds) {
        if (!globalReachable.has(nodeId)) {
            const node = allNodes.find((n) => n.id === nodeId);
            engineViolations.push({
                type: 'PTP_NO_GRANDMASTER',
                severity: 'error',
                entityId: nodeId,
                message: `Node "${node?.label ?? nodeId}" is on a PTP-plane link but is not reachable from any Grandmaster Clock. Source: RFC 7273 §4.3.`,
                detail: { nodeType: node?.nodeType },
            });
        }
    }
    // If no GMs exist at all and there are PTP links, that's an error
    if (grandmasters.length === 0 && ptpLinks.length > 0) {
        engineViolations.push({
            type: 'PTP_NO_GRANDMASTER',
            severity: 'error',
            entityId: projectId,
            message: 'No Grandmaster Clock node found in design. PTP timing source is undefined.',
            detail: { ptpLinkCount: ptpLinks.length },
        });
    }
    return { domains, ptpViolations: engineViolations };
}
/**
 * Run PTP engine for a project and persist results to DB.
 */
export async function runPtpEngine(projectId) {
    const result = await tracePtpDomains(projectId);
    // Persist domain trace as derived metric
    const domainMetric = {
        id: uuidv4(),
        projectId,
        entityId: projectId,
        entityType: 'project',
        metricType: 'ptp_domain_trace',
        value: result.domains,
    };
    const newViolations = result.ptpViolations.map((v) => ({
        id: uuidv4(),
        projectId,
        entityId: v.entityId,
        entityType: 'node',
        violationType: v.type,
        severity: v.severity,
        message: v.message,
        detail: v.detail,
    }));
    // Append to existing metrics (bandwidth engine cleared + wrote; PTP appends)
    await db.insert(derivedMetrics).values(domainMetric);
    if (newViolations.length > 0)
        await db.insert(violations).values(newViolations);
}
