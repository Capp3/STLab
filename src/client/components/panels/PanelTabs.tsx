import { useUiStore } from '../../store/uiStore.js';
import { useMetricsStore } from '../../store/metricsStore.js';
import { Inspector } from '../inspector/Inspector.js';
import { BandwidthPanel } from './BandwidthPanel.js';
import { PtpPanel } from './PtpPanel.js';
import { ViolationsPanel } from './ViolationsPanel.js';

const TABS = [
  { id: 'inspector' as const, label: 'Inspector' },
  { id: 'bandwidth' as const, label: 'Bandwidth' },
  { id: 'ptp' as const, label: 'PTP' },
  { id: 'violations' as const, label: 'Violations' },
];

export function PanelTabs() {
  const { rightPanelTab, setRightPanelTab } = useUiStore();
  const violations = useMetricsStore((s) => s.data?.violations ?? []);
  const errorCount = violations.filter((v) => v.severity === 'error').length;
  const warningCount = violations.filter((v) => v.severity === 'warning').length;

  return (
    <div
      style={{
        width: 320,
        display: 'flex',
        flexDirection: 'column',
        background: '#16213e',
        borderLeft: '1px solid #0f3460',
      }}
    >
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #0f3460', flexShrink: 0 }}>
        {TABS.map((tab) => {
          const isActive = rightPanelTab === tab.id;
          let badge: string | null = null;
          if (tab.id === 'violations') {
            if (errorCount > 0) badge = String(errorCount);
            else if (warningCount > 0) badge = String(warningCount);
          }
          return (
            <button
              key={tab.id}
              onClick={() => setRightPanelTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 4px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                color: isActive ? '#e2e8f0' : '#64748b',
                fontSize: 11,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
              {badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 2,
                    background: errorCount > 0 ? '#ef4444' : '#f59e0b',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 700,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rightPanelTab === 'inspector' && <Inspector />}
        {rightPanelTab === 'bandwidth' && <BandwidthPanel />}
        {rightPanelTab === 'ptp' && <PtpPanel />}
        {rightPanelTab === 'violations' && <ViolationsPanel />}
      </div>
    </div>
  );
}
