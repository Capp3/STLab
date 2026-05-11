export type ViolationSeverity = 'error' | 'warning' | 'info'
export type ViolationEntityType = 'node' | 'link' | 'flow' | 'project'

export type ViolationType =
  // Bandwidth violations
  | 'BANDWIDTH_EXCEEDED'
  | 'BANDWIDTH_HIGH'
  | 'BACKPLANE_EXCEEDED'
  | 'BACKPLANE_HIGH'
  | 'WIDE_SENDER_BUFFER_RISK'
  // PTP violations
  | 'PTP_NO_GRANDMASTER'
  | 'PTP_DOMAIN_CONFLICT'
  | 'PTP_SWITCH_NO_CLOCK_MODE'
  | 'PTP_GRANDMASTER_ISOLATED'
  | 'PTP_MIXED_TRACEABILITY'
  // Design violations
  | 'PLANE_CROSSING'
  | 'LINK_NO_CAPACITY'
  | 'NODE_MISSING_REQUIRED_FIELD'

export interface Violation {
  id: string
  projectId: string
  entityId: string
  entityType: ViolationEntityType
  violationType: ViolationType
  severity: ViolationSeverity
  message: string
  detail: Record<string, unknown>
}

export const VIOLATION_LABELS: Record<ViolationType, string> = {
  BANDWIDTH_EXCEEDED: 'Link bandwidth exceeded',
  BANDWIDTH_HIGH: 'Link bandwidth high (≥80%)',
  BACKPLANE_EXCEEDED: 'Switch backplane exceeded',
  BACKPLANE_HIGH: 'Switch backplane high (≥80%)',
  WIDE_SENDER_BUFFER_RISK: 'Wide sender buffer risk',
  PTP_NO_GRANDMASTER: 'No grandmaster reachable',
  PTP_DOMAIN_CONFLICT: 'PTP domain conflict',
  PTP_SWITCH_NO_CLOCK_MODE: 'Switch missing PTP clock mode',
  PTP_GRANDMASTER_ISOLATED: 'Grandmaster has no PTP links',
  PTP_MIXED_TRACEABILITY: 'Mixed PTP traceability',
  PLANE_CROSSING: 'Network plane crossing',
  LINK_NO_CAPACITY: 'Link has no capacity defined',
  NODE_MISSING_REQUIRED_FIELD: 'Node missing required field',
}
