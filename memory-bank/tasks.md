# ST Lab — Active Tasks

**Status:** Full reset complete. Ready for first Phase 1 increment.

---

## Next: TASK-003 — Phase 1, Increment 1: Project Skeleton + Docker

**Objective:** Get a working, deployable Vite + React + Express skeleton running in Docker Compose with PostgreSQL and Redis. No application features yet — just a working stack that serves the React app and proves the data connections are live.

**Complexity:** Low  
**Owner:** TBD  
**Operator test required:** Yes — see §15.1 of project brief

### Acceptance criteria
- `docker compose up` starts cleanly.
- Browser at `http://localhost:3000` shows the ST Lab placeholder page.
- PostgreSQL container is healthy and reachable from the app container.
- Redis container is healthy and reachable from the app container.
- No errors in container logs on startup.

### Checklist
- [ ] Add Express server (`src/server/index.ts`) that serves the Vite build and exposes `/api/v1/health`.
- [ ] Add Drizzle ORM config and initial migration (empty schema).
- [ ] Write `Dockerfile` (multi-stage: Vite build + Node server).
- [ ] Write `compose.yml` (app, postgres, redis with named volumes).
- [ ] Write `.env.example` with all required environment variables.
- [ ] `npm install` succeeds.
- [ ] `npm run build` produces `dist/`.
- [ ] Docker image builds successfully.
- [ ] Operator test: `docker compose up -d && curl http://localhost:3000` returns HTML.

---

## Completed tasks

| Task ID | Description | Outcome |
|---|---|---|
| TASK-001 | Initial Docker bring-up and persistence | Completed with fixes to Dockerfile and compose.yml |
| TASK-002 | Fix React error #185 (max nested update depth) | Resolved — removed duplicate ReactFlowProvider, switched to plain useState in FlowCanvas |
| RESET | Full project reset — delete all dev files, write new project brief | Complete |

---

*Last updated: Full reset — all prior task context archived.*
