import { useCallback, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, useReactFlow } from '@xyflow/react';
import { nodeTypes } from '../../nodes/index.js';
import { edgeTypes } from './PlaneEdge.js';
import { useDesignStore } from '../../store/designStore.js';
import { useUiStore } from '../../store/uiStore.js';
import { NODE_TYPE_COLORS } from '../../../shared/types/nodes.js';
import type { NodeType } from '../../../shared/types/nodes.js';

export function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useDesignStore();
  const { setSelectedNode, setSelectedEdge } = useUiStore();
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/stlab-node-type');
      if (!nodeType) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(nodeType, position);
    },
    [addNode, screenToFlowPosition]
  );

  return (
    <div ref={reactFlowWrapper} style={{ flex: 1, height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_e, node) => setSelectedNode(node.id)}
        onEdgeClick={(_e, edge) => setSelectedEdge(edge.id)}
        onPaneClick={() => {
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{ type: 'stlabEdge', data: { networkPlane: 'media', capacityMbps: 10000 } }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.08)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => NODE_TYPE_COLORS[node.type as NodeType] ?? '#64748b'}
          maskColor="rgba(15,52,96,0.7)"
          style={{ background: '#16213e' }}
        />
      </ReactFlow>
    </div>
  );
}
