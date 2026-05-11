import { useMetricsStore } from '../../store/metricsStore.js'

interface PtpDomain {
  domainNumber: number
  grandmasterLabel: string
  reachableNodeIds: string[]
}

export function PtpPanel() {
  const metrics = useMetricsStore((s) => s.data?.metrics ?? [])
  const ptpMetric = metrics.find((m) => m.metricType === 'ptp_domain_trace')
  const domains = (ptpMetric?.value ?? []) as PtpDomain[]

  return (
    <div>
      <div className="stlab-panel-section">
        <div className="stlab-panel-title">PTP Domain Trace</div>
        <div style={{ fontSize: 10, color: '#1e40af', background: '#eff6ff', padding: '4px 8px', borderRadius: 4, marginBottom: 10 }}>
          Algorithm: BFS from Grandmaster Clock on PTP-plane links — RFC 7273 §4.3
        </div>
        {domains.length === 0 && (
          <div style={{ color: '#64748b', fontSize: 12 }}>
            No PTP domains traced. Add a Grandmaster Clock node and connect with PTP-plane links.
          </div>
        )}
        {domains.map((d, i) => (
          <div key={i} style={{ marginBottom: 16, background: '#0f3460', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#EAB308', fontWeight: 700, fontSize: 12 }}>Domain {d.domainNumber}</span>
              <span style={{ color: '#94a3b8', fontSize: 11 }}>{d.reachableNodeIds.length} nodes</span>
            </div>
            <div style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 4 }}>
              <span style={{ color: '#64748b' }}>GM: </span>{d.grandmasterLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
