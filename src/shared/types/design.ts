import type { NodeType } from './nodes.js';
import type { NetworkPlane } from './links.js';
import type { EssenceType, FlowProperties } from './flows.js';

/** Canonical design graph — used by client state, API, and JSONB snapshots */
export interface DesignGraph {
  schemaVersion: string;
  nodes: DesignNode[];
  links: DesignLink[];
  flows: DesignFlow[];
}

export interface DesignNode {
  id: string;
  nodeType: NodeType;
  label: string;
  position: { x: number; y: number };
  /** Domain-specific properties — typed as NodeProperties union but stored as JSONB */
  properties: Record<string, unknown>;
}

export interface DesignLink {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  networkPlane: NetworkPlane;
  /** Link capacity in Mbps */
  capacityMbps: number;
  label?: string | undefined;
  properties: Record<string, unknown>;
}

export interface DesignFlow {
  id: string;
  linkId: string;
  essenceType: EssenceType;
  /** Calculated or user-defined bandwidth in Mbps */
  bandwidthMbps: number;
  properties: FlowProperties;
}

/** API response shapes */
export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  metricsDirty: boolean;
  nodeCount?: number;
  linkCount?: number;
  violationCounts?: { error: number; warning: number };
}

export interface DesignRevision {
  id: string;
  projectId: string;
  revisionNumber: number;
  graph: DesignGraph;
  schemaVersion: string;
  createdAt: string;
}

export const CURRENT_SCHEMA_VERSION = '1.0.0';
