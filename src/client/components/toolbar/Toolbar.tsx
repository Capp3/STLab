import { useDesignStore } from '../../store/designStore.js';
import { useProjectStore } from '../../store/projectStore.js';
import { useMetricsStore } from '../../store/metricsStore.js';

export function Toolbar() {
  const { isDirty, isSaving, lastSaved, saveDesign } = useDesignStore();
  const { activeProjectId } = useProjectStore();
  const { fetchMetrics, loading: metricsLoading } = useMetricsStore();

  const handleSave = async () => {
    if (!activeProjectId) return;
    try {
      await saveDesign(activeProjectId);
      await fetchMetrics(activeProjectId);
    } catch (err) {
      console.error('[toolbar] Save failed:', err);
    }
  };

  const handleComputeMetrics = async () => {
    if (!activeProjectId) return;
    await fetchMetrics(activeProjectId);
  };

  return (
    <div
      style={{
        height: 48,
        background: '#0d1929',
        borderBottom: '1px solid #0f3460',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ fontWeight: 800, fontSize: 16, color: '#3b82f6', letterSpacing: '-0.02em', marginRight: 16 }}>
        ST<span style={{ color: '#e2e8f0' }}>Lab</span>
      </div>

      <div style={{ color: '#334155', width: 1, height: 24, background: '#334155' }} />

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving || !activeProjectId}
        style={{
          padding: '5px 14px',
          borderRadius: 6,
          border: 'none',
          background: isDirty ? '#3b82f6' : '#1e3a5f',
          color: 'white',
          fontSize: 12,
          fontWeight: 600,
          cursor: isSaving || !activeProjectId ? 'not-allowed' : 'pointer',
          opacity: isSaving || !activeProjectId ? 0.5 : 1,
          transition: 'background 0.15s',
        }}
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>

      {/* Compute metrics button */}
      <button
        onClick={handleComputeMetrics}
        disabled={metricsLoading || !activeProjectId}
        style={{
          padding: '5px 14px',
          borderRadius: 6,
          border: '1px solid #1e3a5f',
          background: 'transparent',
          color: '#94a3b8',
          fontSize: 12,
          cursor: metricsLoading || !activeProjectId ? 'not-allowed' : 'pointer',
          opacity: metricsLoading || !activeProjectId ? 0.5 : 1,
        }}
      >
        {metricsLoading ? 'Computing…' : '↻ Metrics'}
      </button>

      {/* Status */}
      {lastSaved && (
        <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>
          {isDirty ? '● Unsaved changes' : `✓ Saved ${lastSaved.toLocaleTimeString()}`}
        </span>
      )}
      {!lastSaved && !activeProjectId && (
        <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>No project open</span>
      )}
    </div>
  );
}
