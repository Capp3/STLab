import { create } from 'zustand'
import type { ProjectSummary } from '../../shared/types/design.js'

interface ProjectState {
  projects: ProjectSummary[]
  activeProjectId: string | null
  loading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<ProjectSummary>
  setActiveProject: (id: string | null) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/v1/projects')
      const json = await res.json() as { data: ProjectSummary[] }
      set({ projects: json.data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createProject: async (name, description) => {
    const res = await fetch('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    const json = await res.json() as { data: ProjectSummary }
    set((s) => ({ projects: [...s.projects, json.data] }))
    return json.data
  },

  setActiveProject: (id) => set({ activeProjectId: id }),
}))
