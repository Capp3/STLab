# ST Lab — Active Tasks

## Current Task: Phase 1 MVP — Full Application Build

**Task ID:** TASK-001
**Complexity:** Level 4
**Started:** 2026-05-11
**Workflow:** VAN ✅ → PLAN ✅ → CREATIVE ✅ → BUILD → REFLECT → ARCHIVE

---

## Creative Phases — ALL COMPLETE ✅

| ID | Component | Decision | Doc |
|----|-----------|----------|-----|
| C1 ✅ | Design Document model | Hybrid: Normalized live tables + JSONB snapshot on Save | `memory-bank/creative/creative-design-document-model.md` |
| C2 ✅ | Bandwidth calculation model | Link-annotated flows + ASB formula from VSF TR-05 | `memory-bank/creative/creative-bandwidth-engine.md` |
| C3 ✅ | PTP topology tracing | BFS from GM on PTP-plane links; RFC 7273 violations | `memory-bank/creative/creative-ptp-engine.md` |

---

## Phase A — Foundation ✅ (Config files done)

### Infrastructure

- [x] `package.json` updated — TypeScript, React, Vite, React Flow, Drizzle, Tailwind, Zustand, scripts
- [x] `tsconfig.json` (client) and `tsconfig.server.json` (server)
- [x] `vite.config.ts`
- [x] `tailwind.config.ts` + `postcss.config.js`
- [x] `drizzle.config.ts`
- [x] `.env.example`
- [x] `compose.yml` fixed (environment:, postgres:17, health checks, depends_on)
- [x] `index.html` (Vite entry)
- [x] Directory tree created: `src/client/`, `src/server/`, `migrations/`, `tests/`, `public/`
- [ ] `npm install` — install all declared deps
- [ ] `Dockerfile` — multi-stage build

### Server Entrypoint

- [ ] `src/server/index.ts` — Express server, middleware stack, static serving, `/health`
- [ ] `src/server/db/connection.ts` — Drizzle + pg Pool, env config, optional Redis
- [ ] `src/server/db/migrate.ts` — migration runner (called at startup)
- [ ] `src/server/middleware/errorHandler.ts`
- [ ] `src/server/middleware/validate.ts`

### Client Entrypoint

- [ ] `src/client/main.tsx` — React root, ReactFlowProvider
- [ ] `src/client/App.tsx` — Shell layout (palette + canvas + inspector)
- [ ] `src/client/index.css` — Tailwind base imports

---

## Phase B — Database Schema

### Drizzle Schema

- [ ] `src/server/db/schema.ts` — all tables:
  - `projects` (id, name, description, created_at, updated_at)
  - `design_revisions` (id, project_id, revision_number, graph JSONB, schema_version, created_at)
  - `nodes` (id, design_revision_id, node_type, label, position_x, position_y, properties JSONB)
  - `links` (id, design_revision_id, source_node_id, target_node_id, network_plane, capacity_mbps, properties JSONB)
  - `flows` (id, link_id, essence_type, bandwidth_mbps, properties JSONB)
  - `derived_metrics` (id, design_revision_id, entity_id, entity_type, metric_type, value JSONB, computed_at)
  - `violations` (id, design_revision_id, entity_id, entity_type, violation_type, severity, message, detail JSONB)
  - `reports` (id, project_id, design_revision_id, format, status, artifact_path, created_at)

### Shared Types

- [ ] `src/shared/types/nodes.ts` — NodeType enum + typed NodeProperties union
- [ ] `src/shared/types/links.ts` — NetworkPlane enum + LinkProperties
- [ ] `src/shared/types/flows.ts` — EssenceType enum + FlowProperties
- [ ] `src/shared/types/violations.ts` — ViolationType enum + Violation shape
- [ ] `src/shared/types/design.ts` — DesignGraph, DesignNode, DesignLink (canonical shapes)

### Migration

- [ ] Run `npm run db:generate` → produces first migration file
- [ ] Verify migration with `npm run db:migrate` against local DB

---

## Phase C — Backend API + Engines

### API Routes

- [ ] `src/server/api/projects.ts` — GET/POST list/create, GET/PATCH/DELETE by ID
- [ ] `src/server/api/designs.ts` — GET current design, PUT new revision (triggers recompute)
- [ ] `src/server/api/metrics.ts` — GET derived metrics + violations for a design revision
- [ ] `src/server/api/reports.ts` — POST generate, GET list, GET download

### Bandwidth Engine (`src/server/engines/bandwidth.ts`)

Source: `research/report-bandwidth.md`

- [ ] `computeLinkUtilization(link, flows)` → utilization%, used_mbps, available_mbps
- [ ] `computeSwitchMetrics(switchNode, links, flows)` → aggregate ingress/egress, backplane %
- [ ] `detectBandwidthViolations(design)` → Violation[] for over-subscribed links/switches
- [ ] Handle shared-switch non-ST2110 load offset (Existing Non-ST2110 Load field)

### PTP Engine (`src/server/engines/ptp.ts`)

Source: `research/report-ptp.md`

- [ ] `tracePtpDomains(design)` → Map<domainNumber, Set<nodeId>> reachability map
- [ ] `detectGrandmasterPresence(design)` → Violation[] if no GM in a PTP domain
- [ ] `detectDomainConflicts(design)` → Violation[] for mismatched domain numbers on same PTP path
- [ ] `detectSwitchClockMode(design)` → Violation[] for switches on PTP plane missing BC/TC declaration

### Metric Orchestrator

- [ ] `src/server/engines/index.ts` — `recomputeMetrics(designRevisionId)`:
      runs bandwidth + PTP engines, writes derived_metrics + violations rows, clears old

---

## Phase D — Frontend Canvas Editor

### State Stores (Zustand)

- [ ] `src/client/store/designStore.ts` — RF nodes/edges, selection, dirty flag, save/load
- [ ] `src/client/store/projectStore.ts` — project metadata, revision list, active project
- [ ] `src/client/store/metricsStore.ts` — violations, per-link/switch metrics
- [ ] `src/client/store/uiStore.ts` — panel state, active inspector tab

### Node Definitions (React Flow custom nodes)

- [ ] `src/client/nodes/index.ts` — nodeTypes registry
- [ ] `src/client/nodes/SingleSourceNode.tsx`
- [ ] `src/client/nodes/GroupSourceNode.tsx`
- [ ] `src/client/nodes/SingleDestinationNode.tsx`
- [ ] `src/client/nodes/GroupDestinationNode.tsx`
- [ ] `src/client/nodes/DedicatedSwitchNode.tsx`
- [ ] `src/client/nodes/SharedSwitchNode.tsx`
- [ ] `src/client/nodes/GrandmasterClockNode.tsx`
- [ ] `src/client/nodes/NmosDeviceNode.tsx`
- [ ] `src/client/nodes/BaseNode.tsx` — shared wrapper (label, violation badge, handles)

### Canvas

- [ ] `src/client/components/canvas/FlowCanvas.tsx` — ReactFlow instance, controls, minimap
- [ ] `src/client/components/canvas/PlaneEdge.tsx` — custom edge with plane color + utilization badge
- [ ] `src/client/components/canvas/CanvasToolbar.tsx` — zoom, fit, undo, save

### Palette

- [ ] `src/client/components/palette/NodePalette.tsx` — DnD node type list by category
- [ ] `src/client/components/palette/PaletteItem.tsx` — draggable item with preview

### Inspector

- [ ] `src/client/components/inspector/Inspector.tsx` — context-aware (node vs link vs empty)
- [ ] `src/client/components/inspector/forms/` — one form per node type (8 forms + link form)
  - `SingleSourceForm.tsx`, `GroupSourceForm.tsx`, `SingleDestinationForm.tsx`
  - `GroupDestinationForm.tsx`, `DedicatedSwitchForm.tsx`, `SharedSwitchForm.tsx`
  - `GrandmasterClockForm.tsx`, `NmosDeviceForm.tsx`, `LinkForm.tsx`

### Engineering Panels

- [ ] `src/client/components/panels/BandwidthPanel.tsx` — per-link + per-switch utilization table
- [ ] `src/client/components/panels/PtpPanel.tsx` — domain summary, GM params, switch roles
- [ ] `src/client/components/panels/ViolationsPanel.tsx` — filterable violation list
- [ ] `src/client/components/panels/PanelTabs.tsx` — tab switcher

### API Hooks

- [ ] `src/client/hooks/useDesign.ts` — load/save design, trigger metrics
- [ ] `src/client/hooks/useProjects.ts` — list/create/select projects
- [ ] `src/client/hooks/useMetrics.ts` — fetch violations + metrics after save

---

## Phase E — Reports + Docker

### Report Generation

- [ ] `src/server/reports/templates/report.html.mustache` — full engineering report template
- [ ] `src/server/reports/generator.ts` — assembles data from DB, renders Mustache → HTML
- [ ] `src/server/reports/pdf.ts` — Puppeteer: load HTML, print to PDF
- [ ] Report sections: cover, design summary, bandwidth budget, PTP architecture, NMOS inventory, link inventory

### Docker

- [ ] `Dockerfile` — multi-stage (client build → production server image)
- [ ] Verify `docker compose up` starts stlab + stlab-db + stlab-redis
- [ ] `Makefile` — add `make dev`, `make build`, `make up`, `make down`, `make migrate`

---

## Phase 1 MVP Acceptance Criteria

- [ ] Engineer can create a named project
- [ ] Engineer can add all 8 node types to canvas via palette drag-and-drop
- [ ] Engineer can draw plane-aware links between nodes
- [ ] Engineer can configure all node datapoints in the inspector
- [ ] Bandwidth utilization calculated per-link and per-switch; violations shown
- [ ] PTP fields visible on Grandmaster and Switch nodes; PTP panel summarizes design
- [ ] Violations panel lists all errors/warnings with affected entities
- [ ] Project state saved to and loaded from PostgreSQL
- [ ] HTML report generated from persisted design state
- [ ] PDF export works
- [ ] `docker compose up` brings up full stack cleanly
