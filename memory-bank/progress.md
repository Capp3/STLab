# Progress

## 2026-05-12 — Full Reset

**Status:** Reset complete. Clean skeleton in place.

### What was learned from the first attempt

| Area | Finding |
|---|---|
| React Flow + Zustand | `<ReactFlow>` v12 creates its own `ReactFlowProvider` internally. A second outer provider creates two conflicting stores. Never use an outer `ReactFlowProvider`. |
| Zustand selectors | Full-store subscriptions (`useStore()`) in ancestor components cause `useSyncExternalStore` to force synchronous re-renders during React's commit phase. Always use selective selectors. |
| useNodesState / useEdgesState | These RF hooks subscribe to RF's internal Zustand store via `useSyncExternalStore`. Using them in a component that is the parent of `<ReactFlow>` creates nested commit loops. Use plain `useState` instead. |
| Build pace | Building faster than the operator can validate produces a broken system. Slow down. |

### Current state

- All development files deleted.
- New project brief written (`docs/projectbrief.md` v2.0).
- Clean Vite + React 18 + TypeScript skeleton in place.
- No server, no database, no dependencies beyond React and Vite.

### Next milestone

TASK-003: Working Docker Compose stack (app + PostgreSQL + Redis) with a health endpoint. Operator test: `docker compose up` → browser shows placeholder page, no errors in logs.

---

## Prior history (archived)

| Task | Outcome |
|---|---|
| TASK-001: Docker bring-up | Fixed — Dockerfile used `npm ci` without a lock file; replaced with `npm install`. Added named volumes. Fixed Express SPA fallback route for Express 5 / path-to-regexp compatibility. |
| TASK-002: React error #185 | Fixed — removed outer `ReactFlowProvider`, switched `FlowCanvas` to plain `useState`, used selective Zustand selectors in `App.tsx`. |
