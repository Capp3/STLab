import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import type { DesignGraph } from '../../shared/types/design.js';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/design.js';
import { v4 as uuidv4 } from 'uuid';

interface DesignState {
  nodes: Node[];
  edges: Edge[];
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (nodeType: string, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  loadDesign: (graph: DesignGraph) => void;
  saveDesign: (projectId: string) => Promise<void>;
  clearDesign: () => void;
}

function graphToRF(graph: DesignGraph): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = graph.nodes.map((n) => ({
    id: n.id,
    type: n.nodeType,
    position: n.position,
    data: { label: n.label, nodeType: n.nodeType, ...n.properties },
  }));
  const edges: Edge[] = graph.links.map((l) => ({
    id: l.id,
    source: l.sourceNodeId,
    target: l.targetNodeId,
    type: 'stlabEdge',
    data: {
      networkPlane: l.networkPlane,
      capacityMbps: l.capacityMbps,
      label: l.label,
      ...l.properties,
    },
  }));
  return { nodes, edges };
}

function rfToGraph(nodes: Node[], edges: Edge[]): DesignGraph {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    nodes: nodes.map((n) => ({
      id: n.id,
      nodeType: ((n.data['nodeType'] as string) ?? n.type ?? 'single_source') as DesignGraph['nodes'][0]['nodeType'],
      label: (n.data['label'] as string | undefined) ?? 'Untitled',
      position: n.position,
      properties: Object.fromEntries(Object.entries(n.data).filter(([k]) => !['label', 'nodeType'].includes(k))),
    })),
    links: edges.map((e) => ({
      id: e.id,
      sourceNodeId: e.source,
      targetNodeId: e.target,
      networkPlane: (e.data?.['networkPlane'] as DesignGraph['links'][0]['networkPlane'] | undefined) ?? 'media',
      capacityMbps: (e.data?.['capacityMbps'] as number | undefined) ?? 10000,
      label: e.data?.['label'] as string | undefined,
      properties: Object.fromEntries(
        Object.entries(e.data ?? {}).filter(([k]) => !['networkPlane', 'capacityMbps', 'label'].includes(k))
      ),
    })),
    flows: [],
  };
}

export const useDesignStore = create<DesignState>((set, get) => ({
  nodes: [],
  edges: [],
  isDirty: false,
  isSaving: false,
  lastSaved: null,

  onNodesChange: (changes) => {
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes), isDirty: true }));
  },

  onEdgesChange: (changes) => {
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges), isDirty: true }));
  },

  onConnect: (connection) => {
    const newEdge: Edge = {
      id: uuidv4(),
      source: connection.source,
      target: connection.target,
      type: 'stlabEdge',
      data: { networkPlane: 'media', capacityMbps: 10000 },
    };
    set((s) => ({ edges: [...s.edges, newEdge], isDirty: true }));
  },

  addNode: (nodeType, position) => {
    const newNode: Node = {
      id: uuidv4(),
      type: nodeType,
      position,
      data: { label: `New ${nodeType.replace(/_/g, ' ')}`, nodeType },
    };
    set((s) => ({ nodes: [...s.nodes, newNode], isDirty: true }));
  },

  updateNodeData: (nodeId, data) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n)),
      isDirty: true,
    }));
  },

  loadDesign: (graph) => {
    const { nodes, edges } = graphToRF(graph);
    set({ nodes, edges, isDirty: false, lastSaved: new Date() });
  },

  saveDesign: async (projectId) => {
    set({ isSaving: true });
    const { nodes, edges } = get();
    const graph = rfToGraph(nodes, edges);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/design`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graph),
      });
      if (!res.ok) throw new Error('Save failed');
      set({ isDirty: false, isSaving: false, lastSaved: new Date() });
    } catch (err) {
      set({ isSaving: false });
      throw err;
    }
  },

  clearDesign: () => set({ nodes: [], edges: [], isDirty: false }),
}));
