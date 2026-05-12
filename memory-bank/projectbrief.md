# ST Lab — Memory Bank Project Brief

**Full brief:** `docs/projectbrief.md` (v2.0 — Full Reset)  
**Research:** `research/` and `docs/research/` — do not modify.

## One-paragraph summary

ST Lab is a browser-hosted engineering application for planning SMPTE ST 2110 IP media systems. Engineers build visual Node-RED–style diagrams (nodes + typed links) that carry structured domain data: bandwidth, PTP timing, NMOS context. Reports are generated server-side from PostgreSQL-persisted state. Phase 1 is strictly: project management, design canvas, 8 node types, network planes, bandwidth calculations, PTP fields, violation detection, persistence, and report generation. Development is slow and iterative — each increment is operator-tested by a broadcast engineer before the next begins.

## Hard constraints (never violate)

1. No outer `ReactFlowProvider` — `<ReactFlow>` provides its own.
2. Selective Zustand selectors only in components that are ancestors of the canvas.
3. Plain `useState` for RF node/edge state — not `useNodesState`/`useEdgesState`.
4. Every increment must pass operator testing before the next begins.
5. PostgreSQL is the system of record — never persist durable state only in Redis.
6. Research documents in `research/` are read-only source-of-truth — never modify them.

## Phase 1 scope (MVP only)

- Project CRUD + persistence
- Design canvas (Node-RED style)
- 8 node types with schemas
- Network plane–typed links
- Bandwidth utilisation calculations
- PTP fields and violation detection
- Report generation (HTML + PDF)
- Docker Compose deployment
