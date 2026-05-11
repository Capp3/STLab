import { create } from 'zustand'

type RightPanelTab = 'inspector' | 'bandwidth' | 'ptp' | 'violations'

interface UiState {
  selectedNodeId: string | null
  selectedEdgeId: string | null
  rightPanelTab: RightPanelTab
  showProjectModal: boolean
  setSelectedNode: (id: string | null) => void
  setSelectedEdge: (id: string | null) => void
  setRightPanelTab: (tab: RightPanelTab) => void
  setShowProjectModal: (show: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  rightPanelTab: 'inspector',
  showProjectModal: false,
  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setShowProjectModal: (show) => set({ showProjectModal: show }),
}))
