import { useMetricsStore } from '../../store/metricsStore.js'
import { VIOLATION_LABELS } from '../../../shared/types/violations.js'
import type { ViolationType } from '../../../shared/types/violations.js'

export function ViolationsPanel() {
  const violations = useMetricsStore((s) => s.data?.violations ?? [])
  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity === 'warning')

  if (violations.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#22c55e', marginTop: 20 }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>No violations</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Design is within defined parameters</div>
      </div>
    )
  }

  return (
    <div>
      {errors.length > 0 && (
        <div className="stlab-panel-section">
          <div className="stlab-panel-title" style={{ color: '#ef4444' }}>
            Errors ({errors.length})
          </div>
          {errors.map((v) => (
            <div key={v.id} style={{ marginBottom: 10, background: 'rgba(239,68,68,0.08)', borderRadius: 6, padding: '8px 10px', borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#f87171', marginBottom: 3 }}>
                {VIOLATION_LABELS[v.violationType as ViolationType] ?? v.violationType}
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1' }}>{v.message}</div>
            </div>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="stlab-panel-section">
          <div className="stlab-panel-title" style={{ color: '#f59e0b' }}>
            Warnings ({warnings.length})
          </div>
          {warnings.map((v) => (
            <div key={v.id} style={{ marginBottom: 10, background: 'rgba(245,158,11,0.08)', borderRadius: 6, padding: '8px 10px', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#fbbf24', marginBottom: 3 }}>
                {VIOLATION_LABELS[v.violationType as ViolationType] ?? v.violationType}
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1' }}>{v.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
