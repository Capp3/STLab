import type { DragEvent } from 'react';
import { NODE_CATEGORIES, NODE_TYPE_COLORS, NODE_TYPE_LABELS } from '../../../shared/types/nodes.js';
import type { NodeType } from '../../../shared/types/nodes.js';

function PaletteItem({ nodeType }: { nodeType: NodeType }) {
  const color = NODE_TYPE_COLORS[nodeType];
  const label = NODE_TYPE_LABELS[nodeType];

  const onDragStart = (e: DragEvent) => {
    e.dataTransfer.setData('application/stlab-node-type', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="palette-item" draggable onDragStart={onDragStart}>
      <div className="palette-dot" style={{ backgroundColor: color }} />
      <span style={{ color: '#cbd5e1', fontSize: 12 }}>{label}</span>
    </div>
  );
}

export function NodePalette() {
  return (
    <div
      style={{
        width: 188,
        background: '#16213e',
        borderRight: '1px solid #0f3460',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #0f3460' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#64748b',
          }}
        >
          Node Palette
        </div>
        <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>Drag nodes onto canvas</div>
      </div>

      {NODE_CATEGORIES.map((cat) => (
        <div key={cat.label}>
          <div
            style={{
              padding: '10px 12px 4px',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#475569',
            }}
          >
            {cat.label}
          </div>
          {cat.types.map((t) => (
            <PaletteItem key={t} nodeType={t} />
          ))}
        </div>
      ))}
    </div>
  );
}
