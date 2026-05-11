import type { ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NODE_TYPE_COLORS } from '../../shared/types/nodes.js';
import type { NodeType } from '../../shared/types/nodes.js';
import { useMetricsStore } from '../store/metricsStore.js';

interface BaseNodeProps {
  id: string;
  nodeType: NodeType;
  label: string;
  detail?: string | undefined;
  icon?: string | undefined;
  selected?: boolean | undefined;
  children?: ReactNode;
}

export function BaseNode({ id, nodeType, label, detail, icon, selected, children }: BaseNodeProps) {
  const color = NODE_TYPE_COLORS[nodeType] ?? '#64748b';
  const violations = useMetricsStore((s) => s.data?.violations.filter((v) => v.entityId === id) ?? []);
  const hasError = violations.some((v) => v.severity === 'error');
  const hasWarning = !hasError && violations.some((v) => v.severity === 'warning');

  return (
    <div className={`stlab-node ${selected ? 'selected' : ''}`} style={{ borderColor: color }}>
      {(hasError || hasWarning) && (
        <div className={`violation-badge ${hasError ? 'error' : 'warning'}`}>{violations.length}</div>
      )}

      <div className="stlab-node-header" style={{ backgroundColor: color }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span>{nodeType.replace(/_/g, ' ').toUpperCase()}</span>
      </div>

      <div className="stlab-node-body">
        <div className="stlab-node-label">{label}</div>
        {detail && <div className="stlab-node-detail">{detail}</div>}
        {children}
      </div>

      <Handle type="target" position={Position.Left} style={{ background: color, border: `2px solid ${color}` }} />
      <Handle type="source" position={Position.Right} style={{ background: color, border: `2px solid ${color}` }} />
    </div>
  );
}
