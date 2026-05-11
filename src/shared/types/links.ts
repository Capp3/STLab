export type NetworkPlane = 'media' | 'ptp' | 'nmos' | 'management'
export type LinkStatus = 'up' | 'down' | 'degraded' | 'unknown'
export type LinkMedium = 'fibre' | 'copper' | 'virtual'

export interface LinkProperties {
  linkType?: 'physical' | 'logical'
  medium?: LinkMedium
  status?: LinkStatus
  vlan?: number
  subnet?: string
  vrf?: string
  vlanTagged?: boolean
  /** Which planes this link carries (primary = networkPlane field; extras here) */
  additionalPlanes?: NetworkPlane[]
  /** PTP metadata when networkPlane includes 'ptp' */
  ptpPresence?: boolean
  ptpRoleReference?: string
  ptpDomainNumber?: number
  /** NMOS metadata */
  nmosPresence?: boolean
  nmosEndpointReference?: string
  /** Latency estimate in microseconds */
  latencyUs?: number
  /** ST 2022-7: this link carries redundant path */
  redundancyGroup?: string
  notes?: string
}

export const NETWORK_PLANE_LABELS: Record<NetworkPlane, string> = {
  media: 'Media',
  ptp: 'PTP Timing',
  nmos: 'NMOS / Control',
  management: 'Management',
}

export const NETWORK_PLANE_COLORS: Record<NetworkPlane, string> = {
  media: '#3B82F6',
  ptp: '#EAB308',
  nmos: '#06B6D4',
  management: '#6B7280',
}

/** Default link capacities in Mbps by connection speed shorthand */
export const DEFAULT_LINK_CAPACITY_MBPS: Record<string, number> = {
  '1G': 1000,
  '10G': 10000,
  '25G': 25000,
  '40G': 40000,
  '100G': 100000,
}
