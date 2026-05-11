/**
 * ST Lab Bandwidth Calculation Engine
 *
 * All formulas sourced from research/report-bandwidth.md.
 * ASB formula: VSF TR-05:2018 §7.2.1 (Informative formula on Normative pgroup data)
 * Overhead constants: RFC 3550, IEEE 802.3 (Normative)
 * Utilization thresholds: Engineering policy — NOT normatively defined in ST 2110 standards
 */

import { db } from '../db/connection.js';
import { nodes, links, flows, derivedMetrics, violations } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { OVERHEAD_BYTES, PGROUP_TABLE } from '../../shared/types/flows.js';
import type { ViolationType } from '../../shared/types/violations.js';
import { v4 as uuidv4 } from 'uuid';

/** Engineering policy thresholds — ASSUMPTION, labeled as non-normative */
const UTILIZATION_ERROR_THRESHOLD = 1.0; // 100%
const UTILIZATION_WARNING_THRESHOLD = 0.8; // 80%

export interface LinkMetrics {
  linkId: string;
  usedMbps: number;
  capacityMbps: number;
  availableMbps: number;
  utilizationPct: number;
  flowCount: number;
  wideSenderCount: number;
}

export interface SwitchMetrics {
  nodeId: string;
  totalIngressMbps: number;
  totalEgressMbps: number;
  backplaneCapacityGbps: number;
  backplaneUsedMbps: number;
  backplaneUtilizationPct: number;
}

/**
 * Compute per-packet wire-rate overhead in bytes.
 * Source: research/report-bandwidth.md §3.5 (Normative: RFC 3550, IEEE 802.3)
 */
export function computeOverheadBytes(vlanTagged: boolean): number {
  return vlanTagged ? OVERHEAD_BYTES.totalWithVlan : OVERHEAD_BYTES.totalNoVlan;
}

/**
 * Compute ST 2110-20 video essence bandwidth using the VSF TR-05 ASB formula.
 * Source: research/report-bandwidth.md §3.1
 * Formula label: INFORMATIVE formula on NORMATIVE pgroup data from ST 2110-20:2017 Table 4
 *
 * @returns bandwidth in Mbps
 */
export function computeVideoAsb(params: {
  width: number;
  height: number;
  frameRateNumerator: number;
  frameRateDenominator: number;
  sampling: string;
  bitDepth: number;
}): { asbMbps: number; packetsPerFrame: number; confidence: 'high' | 'medium' } {
  const { width, height, frameRateNumerator, frameRateDenominator, sampling, bitDepth } = params;
  const exactFrameRate = frameRateNumerator / frameRateDenominator;

  const pgroupEntry = PGROUP_TABLE[sampling]?.[bitDepth];
  if (!pgroupEntry) {
    // Fallback: simplified estimate (non-normative, medium confidence)
    const chromaFactor = sampling.includes('4:2:2') ? 2 : sampling.includes('4:2:0') ? 1.5 : 3;
    const asbMbps = (width * height * exactFrameRate * bitDepth * chromaFactor) / 1_000_000;
    return { asbMbps, packetsPerFrame: 0, confidence: 'medium' };
  }

  const { pgroupsize, pgroupcoverage } = pgroupEntry;

  // VSF TR-05:2018 §7.2.1 — three-step calculation
  const packetsPerFrame = 1 + Math.floor((width * height) / (Math.floor(1426 / pgroupsize) * pgroupcoverage));
  const bitsPerPacket = 8 * Math.floor(1426 / pgroupsize) * pgroupsize + 94;
  const asbMbps = (packetsPerFrame * bitsPerPacket * exactFrameRate) / 1_000_000;

  return { asbMbps, packetsPerFrame, confidence: 'high' };
}

/**
 * Compute ST 2110-30 audio essence bandwidth.
 * Source: research/report-bandwidth.md §3.3 (Normative parameters from ST 2110-30, AES67)
 *
 * @returns bandwidth in Mbps
 */
export function computeAudioBandwidth(params: {
  sampleRate: number;
  bitDepth: number;
  channels: number;
  packetTimeMs: number;
  vlanTagged: boolean;
}): number {
  const { sampleRate, bitDepth, channels, packetTimeMs, vlanTagged } = params;
  const samplesPerPacket = sampleRate * (packetTimeMs / 1000);
  const payloadBytesPerPacket = samplesPerPacket * (bitDepth / 8) * channels;
  const packetsPerSecond = 1000 / packetTimeMs;
  const overheadBytes = computeOverheadBytes(vlanTagged);
  return ((payloadBytesPerPacket + overheadBytes) * packetsPerSecond * 8) / 1_000_000;
}

/**
 * Compute ANC (ST 2110-40) bandwidth estimate.
 * Source: research/report-bandwidth.md §3.4
 * ASSUMPTION — LABELED: No normative floor/ceiling defined in SMPTE standards.
 * Typical range: 50–100 kbps per flow (observational reference).
 */
export function computeAncBandwidth(): { mbps: number; confidence: 'low'; assumption: string } {
  return {
    mbps: 0.075, // 75 kbps midpoint of 50–100 kbps range
    confidence: 'low',
    assumption:
      'ASSUMPTION: ANC bandwidth is non-normative. Typical 50–100 kbps (observational). Verify per deployment.',
  };
}

/** Compute effective bandwidth for a flow including ST 2022-7 doubling */
function effectiveFlowBandwidth(flow: {
  bandwidthMbps: number;
  st2022_7Protected: boolean;
  properties: unknown;
}): number {
  // Overhead already included in calculated bandwidth; just apply 2022-7 multiplier
  return flow.st2022_7Protected ? flow.bandwidthMbps * 2 : flow.bandwidthMbps;
}

/**
 * Compute per-link utilization metrics.
 * Source: research/report-bandwidth.md §5.2
 */
export async function computeLinkMetrics(linkId: string): Promise<LinkMetrics | null> {
  const link = await db.query.links.findFirst({ where: eq(links.id, linkId) });
  if (!link) return null;

  const linkFlows = await db.query.flows.findMany({ where: eq(flows.linkId, linkId) });
  const usedMbps = linkFlows.reduce((sum, f) => sum + effectiveFlowBandwidth(f), 0);
  const wideSenderCount = linkFlows.filter((f) => f.senderType === 'W').length;

  return {
    linkId,
    usedMbps,
    capacityMbps: link.capacityMbps,
    availableMbps: link.capacityMbps - usedMbps,
    utilizationPct: link.capacityMbps > 0 ? (usedMbps / link.capacityMbps) * 100 : 0,
    flowCount: linkFlows.length,
    wideSenderCount,
  };
}

/**
 * Compute per-switch metrics (ingress, egress, backplane).
 * Source: research/report-bandwidth.md §6.2
 */
export async function computeSwitchMetrics(nodeId: string, projectId: string): Promise<SwitchMetrics | null> {
  const node = await db.query.nodes.findFirst({ where: and(eq(nodes.id, nodeId), eq(nodes.projectId, projectId)) });
  if (!node || !['dedicated_switch', 'shared_switch'].includes(node.nodeType)) return null;

  const props = node.properties as Record<string, unknown>;
  const backplaneCapacityGbps = (props['backplaneCapacityGbps'] as number | undefined) ?? 0;
  const existingLoadGbps = (props['existingNonSt2110LoadGbps'] as number | undefined) ?? 0;

  const connectedLinks = await db.query.links.findMany({
    where: and(eq(links.projectId, projectId)),
  });
  const switchLinks = connectedLinks.filter((l) => l.sourceNodeId === nodeId || l.targetNodeId === nodeId);

  let totalIngressMbps = 0;
  let totalEgressMbps = 0;
  const uniqueFlowIds = new Set<string>();

  for (const link of switchLinks) {
    const linkFlows = await db.query.flows.findMany({ where: eq(flows.linkId, link.id) });
    const linkUsedMbps = linkFlows.reduce((sum, f) => sum + effectiveFlowBandwidth(f), 0);
    linkFlows.forEach((f) => uniqueFlowIds.add(f.id));

    if (link.targetNodeId === nodeId) {
      totalIngressMbps += linkUsedMbps;
    } else {
      totalEgressMbps += linkUsedMbps;
    }
  }

  // Backplane: total unique flows through the switch (multicast counted once)
  const allFlows = await db.query.flows.findMany({
    where: eq(flows.projectId, projectId),
  });
  const backplaneFlows = allFlows.filter((f) => uniqueFlowIds.has(f.id));
  const backplaneUsedMbps = backplaneFlows.reduce((sum, f) => sum + f.bandwidthMbps, 0);

  const availableBackplaneMbps = (backplaneCapacityGbps - existingLoadGbps) * 1000;
  const backplaneUtilizationPct = availableBackplaneMbps > 0 ? (backplaneUsedMbps / availableBackplaneMbps) * 100 : 0;

  return {
    nodeId,
    totalIngressMbps,
    totalEgressMbps,
    backplaneCapacityGbps,
    backplaneUsedMbps,
    backplaneUtilizationPct,
  };
}

/**
 * Run bandwidth engine for a project: compute metrics and detect violations.
 * Results written to derived_metrics and violations tables.
 */
export async function runBandwidthEngine(projectId: string): Promise<void> {
  const projectLinks = await db.query.links.findMany({ where: eq(links.projectId, projectId) });
  const projectNodes = await db.query.nodes.findMany({ where: eq(nodes.projectId, projectId) });

  const newViolations: Array<typeof violations.$inferInsert> = [];
  const newMetrics: Array<typeof derivedMetrics.$inferInsert> = [];

  // Per-link metrics
  for (const link of projectLinks) {
    const metrics = await computeLinkMetrics(link.id);
    if (!metrics) continue;

    newMetrics.push({
      id: uuidv4(),
      projectId,
      entityId: link.id,
      entityType: 'link',
      metricType: 'bandwidth',
      value: metrics,
    });

    const ratio = metrics.usedMbps / (metrics.capacityMbps || 1);

    if (ratio >= UTILIZATION_ERROR_THRESHOLD) {
      newViolations.push({
        id: uuidv4(),
        projectId,
        entityId: link.id,
        entityType: 'link',
        violationType: 'BANDWIDTH_EXCEEDED' satisfies ViolationType,
        severity: 'error',
        message: `Link "${link.label ?? link.id}" is over capacity: ${metrics.utilizationPct.toFixed(1)}%`,
        detail: {
          utilizationPct: metrics.utilizationPct,
          usedMbps: metrics.usedMbps,
          capacityMbps: metrics.capacityMbps,
        },
      });
    } else if (ratio >= UTILIZATION_WARNING_THRESHOLD) {
      newViolations.push({
        id: uuidv4(),
        projectId,
        entityId: link.id,
        entityType: 'link',
        violationType: 'BANDWIDTH_HIGH' satisfies ViolationType,
        severity: 'warning',
        message: `Link "${link.label ?? link.id}" utilization is high: ${metrics.utilizationPct.toFixed(1)}% — ASSUMPTION: 80% threshold is engineering policy, not normatively defined`,
        detail: { utilizationPct: metrics.utilizationPct },
      });
    }

    // Wide sender buffer risk flag (ST 2110-21:2017 VRXFULL=720)
    if (metrics.wideSenderCount > 0) {
      newViolations.push({
        id: uuidv4(),
        projectId,
        entityId: link.id,
        entityType: 'link',
        violationType: 'WIDE_SENDER_BUFFER_RISK' satisfies ViolationType,
        severity: 'warning',
        message: `Link has ${metrics.wideSenderCount} Wide (W) sender flow(s). Switch buffers must support VRXFULL=720 per ST 2110-21:2017.`,
        detail: { wideSenderCount: metrics.wideSenderCount },
      });
    }
  }

  // Per-switch metrics
  for (const node of projectNodes.filter((n) => ['dedicated_switch', 'shared_switch'].includes(n.nodeType))) {
    const metrics = await computeSwitchMetrics(node.id, projectId);
    if (!metrics) continue;

    newMetrics.push({
      id: uuidv4(),
      projectId,
      entityId: node.id,
      entityType: 'node',
      metricType: 'switch_bandwidth',
      value: metrics,
    });

    if (metrics.backplaneCapacityGbps > 0) {
      if (metrics.backplaneUtilizationPct >= 100) {
        newViolations.push({
          id: uuidv4(),
          projectId,
          entityId: node.id,
          entityType: 'node',
          violationType: 'BACKPLANE_EXCEEDED' satisfies ViolationType,
          severity: 'error',
          message: `Switch "${node.label}" backplane exceeded: ${metrics.backplaneUtilizationPct.toFixed(1)}%`,
          detail: { backplaneUtilizationPct: metrics.backplaneUtilizationPct },
        });
      } else if (metrics.backplaneUtilizationPct >= 80) {
        newViolations.push({
          id: uuidv4(),
          projectId,
          entityId: node.id,
          entityType: 'node',
          violationType: 'BACKPLANE_HIGH' satisfies ViolationType,
          severity: 'warning',
          message: `Switch "${node.label}" backplane utilization is high: ${metrics.backplaneUtilizationPct.toFixed(1)}%`,
          detail: { backplaneUtilizationPct: metrics.backplaneUtilizationPct },
        });
      }
    }
  }

  // Persist results (clear old, insert new)
  await db.delete(derivedMetrics).where(eq(derivedMetrics.projectId, projectId));
  await db.delete(violations).where(eq(violations.projectId, projectId));

  if (newMetrics.length > 0) await db.insert(derivedMetrics).values(newMetrics);
  if (newViolations.length > 0) await db.insert(violations).values(newViolations);
}
