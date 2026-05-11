# ST Lab — Active Context

## Current Phase: CREATIVE ✅ → BUILD

**Mode:** Planning complete — three creative phases identified, then full BUILD sequence

## Complexity Assessment

**Level 4 (Enterprise/Complex)** — Full application build from greenfield:
- Multi-workstream: Frontend editor + Backend API + PostgreSQL + Calculation engines + Reports
- Requires CREATIVE phase for architecture/design decisions
- Full workflow: VAN → PLAN → CREATIVE → BUILD → REFLECT → ARCHIVE

## Immediate Focus

Scaffolding the initial project structure:
1. Update `package.json` with new stack dependencies
2. Create `src/` directory structure (client + server)
3. Set up TypeScript configuration
4. Create PostgreSQL schema (Drizzle)
5. Implement Express server entrypoint
6. Set up Vite + React for frontend
7. Create React Flow canvas foundation

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | React 18 + React Flow | Purpose-built for node-based editors; active ecosystem |
| Build tool | Vite | Fast HMR, TypeScript-first, modern |
| Canvas library | React Flow (Xyflow) | Industry standard for node editors; ST Lab has same mental model |
| Backend ORM | Drizzle ORM | TypeScript-native, SQL-close, migration support |
| Styling | Tailwind CSS | Utility-first; good for complex engineering UI |
| State | Zustand | Lightweight, works cleanly with React Flow |
| Node-RED approach | Clean-room inspired | Full control; existing NR deps kept for compatible utilities only |

## Open Items (for CREATIVE phase)

1. Auth strategy: simple token vs session vs none (internal tool)
2. Report PDF: Puppeteer in-container vs external renderer
3. Multi-user: single-user for Phase 1 (concurrent editing deferred)
4. Simulation readiness: data model hooks only in Phase 1

## Files to NOT Touch

- `research/report-*.md` — domain truth, no edits
- `research/prompts/` — source prompts, no edits
- `docs/projectbrief.md` — project brief, no edits (inform only)
