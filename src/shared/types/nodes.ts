export type NodeType =
  | 'single_source'
  | 'group_source'
  | 'single_destination'
  | 'group_destination'
  | 'dedicated_switch'
  | 'shared_switch'
  | 'grandmaster_clock'
  | 'nmos_device'

export type SignalType = 'video' | 'audio' | 'combined' | 'anc'
export type ConnectionType =
  | 'fibre_1g'
  | 'fibre_10g'
  | 'fibre_25g'
  | 'fibre_40g'
  | 'fibre_100g'
  | 'copper_1g'
  | 'copper_10g'
  | 'virtual'

export type PtpClockMode = 'boundary' | 'transparent'
export type VideoSampling =
  | 'YCbCr-4:2:2'
  | 'YCbCr-4:4:4'
  | 'YCbCr-4:2:0'
  | 'RGB'
  | 'XYZ'
  | 'ICtCp-4:4:4'
  | 'ICtCp-4:2:2'

/** Fields common to all node types */
export interface BaseNodeProperties {
  deviceType: string
  managementIp?: string
  notes?: string
}

/** Single Source — one ST 2110 essence source */
export interface SingleSourceProperties extends BaseNodeProperties {
  signalType: SignalType
  /** User-defined bandwidth in Mbps; overrides calculation when set */
  bandwidthMbps?: number
  resolution?: string
  videoRefreshRate?: string
  videoWidth?: number
  videoHeight?: number
  videoBitDepth?: number
  videoSampling?: VideoSampling
  videoPackingMode?: 'GPM' | 'BPM'
  /** ST 2110-21 sender type (Narrow / Narrow-Linear / Wide) */
  senderType?: 'N' | 'NL' | 'W'
  audioChannels?: number
  audioBitDepth?: number
  audioSampleRate?: number
  audioPacketTimeMs?: number
  connectionType?: ConnectionType
  ipAddress?: string
  macAddress?: string
  st2022_7Protected?: boolean
}

/** Group Source — bundle of related essences */
export interface GroupSourceProperties extends BaseNodeProperties {
  signalType: SignalType
  numberOfEssences?: number
  aggregateBandwidthMbps?: number
  memberFlowDefinitions?: string
  connectionType?: ConnectionType
  ipRange?: string
  macAddress?: string
  st2022_7Protected?: boolean
}

/** Single Destination */
export interface SingleDestinationProperties extends BaseNodeProperties {
  acceptedSignalType: SignalType
  requiredBandwidthMbps?: number
  resolutionSupport?: string
  videoRefreshRateSupport?: string
  videoBitDepthSupport?: number
  audioChannelsSupport?: number
  audioBitDepthSupport?: number
  audioSampleRateSupport?: number
  connectionType?: ConnectionType
  ipAddress?: string
  macAddress?: string
}

/** Group Destination — multi-flow sink */
export interface GroupDestinationProperties extends BaseNodeProperties {
  acceptedSignalType: SignalType
  numberOfDestinationFlows?: number
  aggregateRequiredBandwidthMbps?: number
  flowMappingRules?: string
  connectionType?: ConnectionType
  ipRange?: string
  macAddress?: string
}

/** Dedicated Switch — reserved for a specific domain */
export interface DedicatedSwitchProperties extends BaseNodeProperties {
  portCount?: number
  portSpeedGbps?: number
  connectedDeviceCount?: number
  flowCount?: number
  essenceCount?: number
  backplaneCapacityGbps?: number
  reservedBandwidthBudgetGbps?: number
  ptpClockMode?: PtpClockMode
  multicastSupport?: boolean
}

/** Shared Switch — mixed-traffic, contention-aware */
export interface SharedSwitchProperties extends BaseNodeProperties {
  portCount?: number
  portSpeedGbps?: number
  connectedDeviceCount?: number
  flowCount?: number
  essenceCount?: number
  backplaneCapacityGbps?: number
  availableBandwidthBudgetGbps?: number
  existingNonSt2110LoadGbps?: number
  qosProfile?: string
  ptpClockMode?: PtpClockMode
  multicastSupport?: boolean
}

/** Grandmaster Clock — PTP timing reference */
export interface GrandmasterClockProperties extends BaseNodeProperties {
  clockClass?: number
  clockAccuracy?: string
  priority1?: number
  priority2?: number
  domainNumber?: number
  announceInterval?: number
  syncInterval?: number
  delayMechanism?: 'E2E' | 'P2P'
  redundancyRole?: 'primary' | 'secondary'
  clockIdentity?: string
  traceabilitySource?: 'gnss' | 'atomic' | 'ntp' | 'internal' | 'unknown'
  holdoverCapability?: boolean
}

/** NMOS Device — control-plane node */
export interface NmosDeviceProperties extends BaseNodeProperties {
  deviceRole?: string
  supportedNmosSpecs?: string[]
  apiEndpoint?: string
  nodeDeviceIdentifier?: string
  registrationMode?: 'peer-to-peer' | 'registered'
  authorizationMode?: string
  associatedMediaFlows?: string[]
}

/** Discriminated union of all property shapes */
export type NodeProperties =
  | ({ nodeType: 'single_source' } & SingleSourceProperties)
  | ({ nodeType: 'group_source' } & GroupSourceProperties)
  | ({ nodeType: 'single_destination' } & SingleDestinationProperties)
  | ({ nodeType: 'group_destination' } & GroupDestinationProperties)
  | ({ nodeType: 'dedicated_switch' } & DedicatedSwitchProperties)
  | ({ nodeType: 'shared_switch' } & SharedSwitchProperties)
  | ({ nodeType: 'grandmaster_clock' } & GrandmasterClockProperties)
  | ({ nodeType: 'nmos_device' } & NmosDeviceProperties)

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  single_source: 'Single Source',
  group_source: 'Group Source',
  single_destination: 'Single Destination',
  group_destination: 'Group Destination',
  dedicated_switch: 'Dedicated Switch',
  shared_switch: 'Shared Switch',
  grandmaster_clock: 'Grandmaster Clock',
  nmos_device: 'NMOS Device',
}

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  single_source: '#3B82F6',
  group_source: '#2563EB',
  single_destination: '#10B981',
  group_destination: '#059669',
  dedicated_switch: '#8B5CF6',
  shared_switch: '#F59E0B',
  grandmaster_clock: '#EAB308',
  nmos_device: '#06B6D4',
}

export const NODE_CATEGORIES = [
  {
    label: 'Sources',
    types: ['single_source', 'group_source'] as NodeType[],
  },
  {
    label: 'Destinations',
    types: ['single_destination', 'group_destination'] as NodeType[],
  },
  {
    label: 'Switches',
    types: ['dedicated_switch', 'shared_switch'] as NodeType[],
  },
  {
    label: 'Timing & Control',
    types: ['grandmaster_clock', 'nmos_device'] as NodeType[],
  },
]
