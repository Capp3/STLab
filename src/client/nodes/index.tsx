import type { NodeProps } from '@xyflow/react'
import { BaseNode } from './BaseNode.js'
import type { NodeType } from '../../shared/types/nodes.js'

type STLabNodeData = {
  label?: string
  nodeType?: NodeType
  deviceType?: string
  signalType?: string
  bandwidthMbps?: number
  resolution?: string
  videoRefreshRate?: string
  ptpClockMode?: string
  domainNumber?: number
  [key: string]: unknown
}

function makeNode(nodeType: NodeType, icon: string, getDetail?: (data: STLabNodeData) => string) {
  return function STLabNode({ id, data, selected }: NodeProps & { data: STLabNodeData }) {
    const detail = getDetail ? getDetail(data) : undefined
    return (
      <BaseNode
        id={id}
        nodeType={nodeType}
        label={String(data['label'] ?? 'Untitled')}
        detail={detail}
        icon={icon}
        selected={selected}
      />
    )
  }
}

export const SingleSourceNode = makeNode('single_source', '→', (d) => {
  const parts: string[] = []
  if (d.signalType) parts.push(String(d.signalType).toUpperCase())
  if (d.resolution) parts.push(String(d.resolution))
  if (d.bandwidthMbps) parts.push(`${d.bandwidthMbps} Mbps`)
  return parts.join(' · ')
})

export const GroupSourceNode = makeNode('group_source', '⇉', (d) => {
  const parts: string[] = []
  if (d.signalType) parts.push(String(d.signalType).toUpperCase())
  if (d.numberOfEssences) parts.push(`${d.numberOfEssences} essences`)
  return parts.join(' · ')
})

export const SingleDestinationNode = makeNode('single_destination', '←', (d) => {
  const parts: string[] = []
  if (d.acceptedSignalType) parts.push(String(d.acceptedSignalType).toUpperCase())
  if (d.requiredBandwidthMbps) parts.push(`${d.requiredBandwidthMbps} Mbps`)
  return parts.join(' · ')
})

export const GroupDestinationNode = makeNode('group_destination', '⇇', (d) => {
  const parts: string[] = []
  if (d.acceptedSignalType) parts.push(String(d.acceptedSignalType).toUpperCase())
  if (d.numberOfDestinationFlows) parts.push(`${d.numberOfDestinationFlows} flows`)
  return parts.join(' · ')
})

export const DedicatedSwitchNode = makeNode('dedicated_switch', '⬡', (d) => {
  const parts: string[] = []
  if (d.portCount) parts.push(`${d.portCount}×${d.portSpeedGbps ?? '?'}G`)
  if (d.ptpClockMode) parts.push(String(d.ptpClockMode).toUpperCase())
  return parts.join(' · ')
})

export const SharedSwitchNode = makeNode('shared_switch', '⬡', (d) => {
  const parts: string[] = []
  if (d.portCount) parts.push(`${d.portCount}×${d.portSpeedGbps ?? '?'}G`)
  if (d.ptpClockMode) parts.push(String(d.ptpClockMode).toUpperCase())
  return parts.join(' · ')
})

export const GrandmasterClockNode = makeNode('grandmaster_clock', '⏱', (d) => {
  const parts: string[] = []
  if (d.domainNumber !== undefined) parts.push(`Domain ${d.domainNumber}`)
  if (d.redundancyRole) parts.push(String(d.redundancyRole))
  return parts.join(' · ')
})

export const NmosDeviceNode = makeNode('nmos_device', '⚙', (d) => {
  const parts: string[] = []
  if (d.deviceRole) parts.push(String(d.deviceRole))
  if (Array.isArray(d.supportedNmosSpecs) && d.supportedNmosSpecs.length > 0) {
    parts.push((d.supportedNmosSpecs as string[]).join(', '))
  }
  return parts.join(' · ')
})

export const nodeTypes = {
  single_source: SingleSourceNode,
  group_source: GroupSourceNode,
  single_destination: SingleDestinationNode,
  group_destination: GroupDestinationNode,
  dedicated_switch: DedicatedSwitchNode,
  shared_switch: SharedSwitchNode,
  grandmaster_clock: GrandmasterClockNode,
  nmos_device: NmosDeviceNode,
}
