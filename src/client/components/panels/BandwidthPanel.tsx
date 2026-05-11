import { useMetricsStore } from '../../store/metricsStore.js'
import { useDesignStore } from '../../store/designStore.js'

export function BandwidthPanel() {
  const metrics = useMetricsStore((s) => s.data?.metrics ?? [])
  const edges = useDesignStore((s) => s.edges)
  const nodes = useDesignStore((s) => s.nodes)

  const bwMetrics = metrics.filter((m) => m.metricType === 'bandwidth')
  const switchMetrics = metrics.filter((m) => m.metricType === 'switch_bandwidth')

  const getNodeLabel = (id: string) => nodes.find((n) => n.id === id)?.data['label'] as string ?? id

  return (
    <div>
      <div className="stlab-panel-section">
        <div className="stlab-panel-title">Per-Link Utilization</div>
        <div style={{ fontSize: 10, color: '#92400e', background: '#fef3c7', padding: '4px 8px', borderRadius: 4, marginBottom: 10 }}>
          ASSUMPTION: 80% threshold is engineering policy, not normatively defined in ST 2110 standards
        </div>
        {bwMetrics.length === 0 && <div style={{ color: '#64748b', fontSize: 12 }}>No link metrics — save design to compute</div>}
        {bwMetrics.map((m) => {
          const v = m.value as Record<string, number>
          const util = v['utilizationPct'] ?? 0
          const edge = edges.find((e) => e.id === m.entityId)
          const label = edge ? `${getNodeLabel(edge.source)} → ${getNodeLabel(edge.target)}` : m.entityId
          const color = util >= 100 ? '#ef4444' : util >= 80 ? '#f59e0b' : '#22c55e'
          return (
            <div key={m.entityId} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{label}</span>
                <span style={{ color, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{util.toFixed(1)}%</span>
              </div>
              <div style={{ background: '#0f3460', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(util, 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                {(v['usedMbps'] ?? 0).toFixed(0)} / {(v['capacityMbps'] ?? 0).toFixed(0)} Mbps
              </div>
            </div>
          )
        })}
      </div>

      {switchMetrics.length > 0 && (
        <div className="stlab-panel-section">
          <div className="stlab-panel-title">Switch Backplane</div>
          {switchMetrics.map((m) => {
            const v = m.value as Record<string, number>
            const util = v['backplaneUtilizationPct'] ?? 0
            const node = nodes.find((n) => n.id === m.entityId)
            const label = node?.data['label'] as string ?? m.entityId
            const color = util >= 100 ? '#ef4444' : util >= 80 ? '#f59e0b' : '#22c55e'
            return (
              <div key={m.entityId} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                  <span style={{ color: '#cbd5e1' }}>{label}</span>
                  <span style={{ color, fontWeight: 700 }}>{util.toFixed(1)}%</span>
                </div>
                <div style={{ background: '#0f3460', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(util, 100)}%`, height: '100%', background: color, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                  In: {(v['totalIngressMbps'] ?? 0).toFixed(0)} Mbps | Out: {(v['totalEgressMbps'] ?? 0).toFixed(0)} Mbps
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
