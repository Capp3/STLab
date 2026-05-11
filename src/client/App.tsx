import { useEffect, useState } from 'react'
import { FlowCanvas } from './components/canvas/FlowCanvas.js'
import { NodePalette } from './components/palette/NodePalette.js'
import { PanelTabs } from './components/panels/PanelTabs.js'
import { Toolbar } from './components/toolbar/Toolbar.js'
import { ProjectManager } from './components/projects/ProjectManager.js'
import { useProjectStore } from './store/projectStore.js'

export default function App() {
  const [showProjects, setShowProjects] = useState(false)
  const { activeProjectId, projects, fetchProjects } = useProjectStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Show project picker on first load when no project is open
  useEffect(() => {
    if (!activeProjectId) {
      setShowProjects(true)
    }
  }, [activeProjectId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Toolbar */}
      <Toolbar />

      {/* Project button in toolbar */}
      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
        <button
          onClick={() => setShowProjects(true)}
          style={{
            padding: '5px 16px', borderRadius: 6, border: '1px solid #1e3a5f',
            background: '#0d1929', color: '#94a3b8', fontSize: 12, cursor: 'pointer',
            maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {activeProjectId
            ? (projects.find((p) => p.id === activeProjectId)?.name ?? 'Unnamed project')
            : '☰  Open / New Project'}
        </button>
      </div>

      {/* Main editor layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <NodePalette />
        <FlowCanvas />
        <PanelTabs />
      </div>

      {/* Project manager modal */}
      {showProjects && <ProjectManager onClose={() => setShowProjects(false)} />}
    </div>
  )
}
