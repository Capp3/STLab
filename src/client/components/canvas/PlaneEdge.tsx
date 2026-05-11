import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { NETWORK_PLANE_COLORS } from '../../../shared/types/links.js';
import type { NetworkPlane } from '../../../shared/types/links.js';
import { useMetricsStore } from '../../store/metricsStore.js';

type PlaneEdgeData = {
  networkPlane?: NetworkPlane;
  capacityMbps?: number;
  label?: string;
  [key: string]: unknown;
};

export function PlaneEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps & { data?: PlaneEdgeData }) {
  const plane = (data?.networkPlane ?? 'media') as NetworkPlane;
  const color = NETWORK_PLANE_COLORS[plane] ?? '#6B7280';
  const metrics = useMetricsStore((s) =>
    s.data?.metrics.find((m) => m.entityId === id && m.metricType === 'bandwidth')
  );
  const utilPct = metrics ? ((metrics.value as Record<string, number>)['utilizationPct'] ?? 0) : null;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          opacity: selected ? 1 : 0.75,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {utilPct !== null && (
            <div
              style={{
                background: utilPct >= 100 ? '#ef4444' : utilPct >= 80 ? '#f59e0b' : 'rgba(22,33,62,0.85)',
                color: 'white',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 10,
                border: `1px solid ${color}`,
                whiteSpace: 'nowrap',
              }}
            >
              {utilPct.toFixed(0)}%
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const edgeTypes = { stlabEdge: PlaneEdge };
