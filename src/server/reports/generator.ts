import Mustache from 'mustache'
import { db } from '../db/connection.js'
import { projects, nodes, links, flows, violations, derivedMetrics } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { NODE_TYPE_LABELS } from '../../shared/types/nodes.js'
import { NETWORK_PLANE_LABELS } from '../../shared/types/links.js'
import { readFileSync } from 'fs'
import path from 'path'

const TEMPLATE_PATH = path.resolve(process.cwd(), 'src/server/reports/templates/report.html.mustache')

interface ReportData {
  projectName: string
  projectDescription: string
  generatedAt: string
  schemaVersion: string
  nodeInventory: Array<{ nodeType: string; typeName: string; label: string; deviceType: string }>
  linkInventory: Array<{
    label: string
    plane: string
    planeName: string
    sourceLabel: string
    targetLabel: string
    capacityMbps: number
    usedMbps: number
    utilizationPct: string
  }>
  switchSummary: Array<{
    label: string
    nodeType: string
    backplaneGbps: number
    ingressMbps: number
    egressMbps: number
    backplaneUtilPct: string
  }>
  ptpDomains: unknown[]
  violations: Array<{ severity: string; violationType: string; message: string; entityId: string }>
  errorCount: number
  warningCount: number
  hasViolations: boolean
}

export async function generateHtmlReport(projectId: string): Promise<string> {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
  if (!project) throw new Error('Project not found')

  const projectNodes = await db.query.nodes.findMany({ where: eq(nodes.projectId, projectId) })
  const projectLinks = await db.query.links.findMany({ where: eq(links.projectId, projectId) })
  const projectViolations = await db.query.violations.findMany({ where: eq(violations.projectId, projectId) })
  const metrics = await db.query.derivedMetrics.findMany({ where: eq(derivedMetrics.projectId, projectId) })

  const nodeById = Object.fromEntries(projectNodes.map((n) => [n.id, n]))
  const bwMetrics = Object.fromEntries(
    metrics.filter((m) => m.metricType === 'bandwidth').map((m) => [m.entityId, m.value as Record<string, number>]),
  )
  const ptpTrace = metrics.find((m) => m.metricType === 'ptp_domain_trace')?.value ?? []

  const nodeInventory = projectNodes.map((n) => ({
    nodeType: n.nodeType,
    typeName: NODE_TYPE_LABELS[n.nodeType as keyof typeof NODE_TYPE_LABELS] ?? n.nodeType,
    label: n.label,
    deviceType: (n.properties as Record<string, unknown>)['deviceType'] as string ?? '—',
  }))

  const linkInventory = projectLinks.map((l) => {
    const m = bwMetrics[l.id]
    const usedMbps = m?.['usedMbps'] ?? 0
    const utilPct = l.capacityMbps > 0 ? ((usedMbps / l.capacityMbps) * 100).toFixed(1) : '—'
    return {
      label: l.label ?? `${nodeById[l.sourceNodeId]?.label ?? '?'} → ${nodeById[l.targetNodeId]?.label ?? '?'}`,
      plane: l.networkPlane,
      planeName: NETWORK_PLANE_LABELS[l.networkPlane as keyof typeof NETWORK_PLANE_LABELS] ?? l.networkPlane,
      sourceLabel: nodeById[l.sourceNodeId]?.label ?? l.sourceNodeId,
      targetLabel: nodeById[l.targetNodeId]?.label ?? l.targetNodeId,
      capacityMbps: l.capacityMbps,
      usedMbps,
      utilizationPct: utilPct,
    }
  })

  const switchSummary = projectNodes
    .filter((n) => ['dedicated_switch', 'shared_switch'].includes(n.nodeType))
    .map((n) => {
      const m = metrics.find((m) => m.metricType === 'switch_bandwidth' && m.entityId === n.id)?.value as Record<string, number> | undefined
      const props = n.properties as Record<string, unknown>
      return {
        label: n.label,
        nodeType: NODE_TYPE_LABELS[n.nodeType as keyof typeof NODE_TYPE_LABELS] ?? n.nodeType,
        backplaneGbps: (props['backplaneCapacityGbps'] as number | undefined) ?? 0,
        ingressMbps: m?.['totalIngressMbps'] ?? 0,
        egressMbps: m?.['totalEgressMbps'] ?? 0,
        backplaneUtilPct: m ? (m['backplaneUtilizationPct']?.toFixed(1) ?? '0.0') : '—',
      }
    })

  const data: ReportData = {
    projectName: project.name,
    projectDescription: project.description ?? '',
    generatedAt: new Date().toISOString(),
    schemaVersion: '1.0.0',
    nodeInventory,
    linkInventory,
    switchSummary,
    ptpDomains: ptpTrace as unknown[],
    violations: projectViolations.map((v) => ({
      severity: v.severity,
      violationType: v.violationType,
      message: v.message,
      entityId: v.entityId,
    })),
    errorCount: projectViolations.filter((v) => v.severity === 'error').length,
    warningCount: projectViolations.filter((v) => v.severity === 'warning').length,
    hasViolations: projectViolations.length > 0,
  }

  const template = readFileSync(TEMPLATE_PATH, 'utf-8')
  return Mustache.render(template, data)
}
