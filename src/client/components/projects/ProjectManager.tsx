import { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore.js';
import { useDesignStore } from '../../store/designStore.js';
import { useMetricsStore } from '../../store/metricsStore.js';
import type { ProjectSummary } from '../../../shared/types/design.js';

interface ProjectManagerProps {
  onClose: () => void;
}

export function ProjectManager({ onClose }: ProjectManagerProps) {
  const { projects, fetchProjects, createProject, setActiveProject, activeProjectId } = useProjectStore();
  const { loadDesign, clearDesign } = useDesignStore();
  const { fetchMetrics } = useMetricsStore();
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpen = async (project: ProjectSummary) => {
    setLoading(true);
    try {
      setActiveProject(project.id);
      const res = await fetch(`/api/v1/projects/${project.id}/design`);
      const json = (await res.json()) as { data: import('../../../shared/types/design.js').DesignGraph };
      loadDesign(json.data);
      await fetchMetrics(project.id);
      onClose();
    } catch (err) {
      console.error('[projects] Failed to open project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const project = await createProject(newName.trim(), newDesc.trim() || undefined);
      setActiveProject(project.id);
      clearDesign();
      setNewName('');
      setNewDesc('');
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#16213e',
          border: '1px solid #0f3460',
          borderRadius: 12,
          width: 560,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #0f3460',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Projects</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Create new project */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #0f3460' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#64748b',
              marginBottom: 12,
            }}
          >
            New Project
          </div>
          <input
            className="stlab-input"
            placeholder="Project name (required)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ marginBottom: 8 }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <input
            className="stlab-input"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            style={{
              padding: '7px 16px',
              borderRadius: 6,
              border: 'none',
              background: newName.trim() ? '#3b82f6' : '#1e3a5f',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              cursor: !newName.trim() || creating ? 'not-allowed' : 'pointer',
              opacity: !newName.trim() || creating ? 0.5 : 1,
            }}
          >
            {creating ? 'Creating…' : 'Create Project'}
          </button>
        </div>

        {/* Existing projects list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#64748b',
              marginBottom: 12,
            }}
          >
            Open Project ({projects.length})
          </div>
          {projects.length === 0 && (
            <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 20 }}>
              No projects yet — create one above
            </div>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => handleOpen(p)}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                cursor: loading ? 'wait' : 'pointer',
                border: `1px solid ${activeProjectId === p.id ? '#3b82f6' : '#1e3a5f'}`,
                background: activeProjectId === p.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                marginBottom: 8,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (activeProjectId !== p.id)
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                if (activeProjectId !== p.id) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{p.description}</div>}
                </div>
                {activeProjectId === p.id && (
                  <span
                    style={{
                      fontSize: 10,
                      background: '#3b82f6',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontWeight: 600,
                    }}
                  >
                    OPEN
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: '#64748b' }}>
                <span>Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
