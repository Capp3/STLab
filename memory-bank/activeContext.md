# Active Context

**Current phase:** Full reset complete — ready to begin Phase 1, Increment 1  
**Date:** 2026-05-12

## What just happened

The first implementation attempt was scrapped. The application was built too quickly without incremental operator validation, accumulating complexity (React Flow state management, Zustand store architecture, Express routing, Docker setup) faster than it could be tested. The result was a persistently broken UI (React error #185 — maximum nested update depth) that consumed significant debugging effort.

**Root cause of the scrapped build:**
- `<ReactFlow>` v12 creates its own `ReactFlowProvider` internally. An outer provider in `main.tsx` created two conflicting RF Zustand stores.
- Components used full-store Zustand subscriptions instead of selective selectors, causing `useSyncExternalStore`-forced synchronous nested re-renders during React Flow's `useLayoutEffect` phase.

**Decision:** Reset to a clean Vite skeleton. Rebuild from scratch at a slower, operator-validated pace.

## Current state of the codebase

```
STLab/
├── src/
│   ├── main.tsx        ← Vite entry point
│   ├── App.tsx         ← Placeholder component
│   └── index.css       ← Base styles
├── index.html
├── package.json        ← React 18 + Vite only
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── docs/
│   └── projectbrief.md ← NEW comprehensive brief (v2.0)
├── research/           ← UNTOUCHED
├── memory-bank/        ← This context
└── public/
    └── favicon.svg
```

## Focus for next session

Begin TASK-003: Wire up the Express server, Drizzle ORM, Dockerfile, and compose.yml to produce a working deployable skeleton. No application features — just a clean, operator-testable stack.

## Hard rules for this rebuild

1. **One increment at a time.** Never begin the next increment before the operator signs off the current one.
2. **No speculative features.** Only build what is in the current increment's checklist.
3. **Selective Zustand selectors only.** Never use full-store subscriptions in components that are ancestors of the React Flow canvas.
4. **No outer ReactFlowProvider.** `<ReactFlow>` provides its own context.
5. **Plain `useState` for RF node/edge state** — not `useNodesState`/`useEdgesState`.
