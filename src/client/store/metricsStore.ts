import { create } from 'zustand';

export interface MetricsSummary {
  metrics: Array<{ entityId: string; entityType: string; metricType: string; value: unknown }>;
  violations: Array<{
    id: string;
    severity: string;
    violationType: string;
    message: string;
    entityId: string;
    entityType: string;
  }>;
  summary: { errorCount: number; warningCount: number; metricsDirty: boolean };
}

interface MetricsState {
  data: MetricsSummary | null;
  loading: boolean;
  fetchMetrics: (projectId: string) => Promise<void>;
  recompute: (projectId: string) => Promise<void>;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  data: null,
  loading: false,

  fetchMetrics: async (projectId) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/metrics`);
      const json = (await res.json()) as { data: MetricsSummary };
      set({ data: json.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  recompute: async (projectId) => {
    await fetch(`/api/v1/projects/${projectId}/metrics/recompute`, { method: 'POST' });
  },
}));
