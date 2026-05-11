# ST Lab — System Patterns

## Core Architectural Patterns

### 1. Layered Architecture
```
Client (React/React Flow) 
  ↕ REST API (Express)
Server (Engines + DB layer)
  ↕ 
PostgreSQL (system of record)
  ↕ [optional]
Redis (cache / session / queue)
```

### 2. Design Document Model (Node-RED Analogy)
A **Design Document** is the ST Lab equivalent of a Node-RED flow JSON:
- Versioned graph snapshot (nodes + links + layout)
- Immutable revisions (design_revisions table)
- JSONB payload for extensible node/link properties
- Schema-versioned for forward compatibility

### 3. Calculation Engine Pattern
All authoritative calculations live **server-side** in `src/server/engines/`:
- `bandwidth.ts` — per-link, per-switch utilization; violation detection
- `ptp.ts` — grandmaster scoring, BC/TC chain, domain consistency
- Engines consume the research reports' rules as implementation ground truth
- Client shows live previews (optimistic); server is authoritative
- Results stored as `derived_metrics` in PostgreSQL with invalidation on design change

### 4. Network Plane Isolation
- Every link has a `network_plane` field: `media | ptp | nmos | management`
- Tracing algorithms must not cross planes without explicit bridge construct
- Violations flagged when plane-crossing detected

### 5. Essence-Flow Separation
- **Essence** = logical media signal (audio / video / anc / data)
- **Flow** = network-level RTP session carrying essence(s)
- One visible link may carry multiple flows; underlying model tracks each flow separately
- Per RFC 3550 (from research): separate RTP session per essence type by default

### 6. Report Generation Pipeline
```
Saved Design Revision (PostgreSQL)
  → Calculation Engine runs against stored state
  → Derived Metrics persisted
  → Report template rendered (Mustache → HTML)
  → PDF generated (Puppeteer) if requested
  → Report artifact stored (PostgreSQL or S3-compatible)
```
Reports are **always** generated from persisted state, never from ephemeral editor state.

### 7. PTP Design Model
- Grandmaster node → boundary/transparent clock switches → endpoints
- PTP domain tracked per-link
- BC/TC clock mode fields on switch nodes
- Phase 1: design metadata + calculations for planning evaluation
- Phase 2+: full chain analysis

### 8. Validation / Violation Pattern
Violations are computed by engines and surfaced as typed violation objects:
```typescript
interface Violation {
  id: string
  type: 'bandwidth_exceeded' | 'ptp_domain_conflict' | 'plane_crossing' | ...
  severity: 'error' | 'warning' | 'info'
  affectedEntityId: string
  affectedEntityType: 'node' | 'link'
  message: string
  detail: Record<string, unknown>
}
```
Violations stored in `derived_metrics` and surfaced in the inspector and engineering panels.

## API Design Patterns

- RESTful resources: `/api/v1/projects`, `/api/v1/designs`, `/api/v1/nodes`, `/api/v1/links`, `/api/v1/reports`
- Design changes always go through a `PATCH /api/v1/designs/:id` → triggers metric invalidation
- Report generation: `POST /api/v1/reports` with design revision ID → async or sync depending on size
- Consistent error shape: `{ error: { code, message, detail } }`

## Frontend Patterns

- React Flow nodes are thin view wrappers; ST Lab domain data lives in Zustand store
- Node palette = draggable node type definitions → drop onto canvas creates node with default datapoints
- Inspector panel = selected node or link properties form → changes debounced and saved to API
- Engineering panels = read-only derived views from server metrics (bandwidth table, PTP summary, violations list)
