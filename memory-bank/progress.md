# ST Lab — Progress

## Status: PLAN Complete — Creative Phases Identified → BUILD Next

**Last Updated:** 2026-05-11

## What Has Been Established

- [x] Memory Bank created and populated
- [x] Project brief fully read and analyzed
- [x] Research reports reviewed (ST 2110, PTP, bandwidth, AES67)
- [x] Architecture decisions made (see techContext.md)
- [x] System patterns defined (see systemPatterns.md)
- [x] Complexity assessed: Level 4

## Workstream Status

| Workstream | Status | Notes |
|-----------|--------|-------|
| Memory Bank | ✅ Complete | All core files created |
| Project scaffold | 🔄 In Progress | Setting up src/, tsconfig, package scripts |
| PostgreSQL schema | ⬜ Pending | Drizzle schema for all entities |
| Backend API | ⬜ Pending | Express routes for CRUD + reports |
| Calculation engines | ⬜ Pending | Bandwidth + PTP engines |
| Frontend scaffold | ⬜ Pending | React + Vite + React Flow setup |
| Canvas editor | ⬜ Pending | Node palette + canvas + wiring |
| Inspector panels | ⬜ Pending | Node/link property editors |
| Engineering panels | ⬜ Pending | BW trace, PTP summary, violations |
| Report generation | ⬜ Pending | HTML/PDF pipeline |
| Docker | ⬜ Pending | Update Compose + Dockerfile for new stack |

## Known Issues / Blockers

- ~~`package.json` has no `start` script~~ — fixed (VAN phase)
- ~~`Dockerfile` references `npm start` which doesn't exist~~ — Dockerfile rewrite pending (Phase E)
- ~~`compose.yml` has `postgres:18`~~ — fixed (VAN phase, now postgres:17)
- ~~`compose.yml` uses `env:` key~~ — fixed (VAN phase, now `environment:`)

## Phase 1 MVP Checklist

- [ ] Engineer can create a project
- [ ] Engineer can add nodes to canvas (all 8 types)
- [ ] Engineer can connect nodes with plane-aware links
- [ ] Engineer can configure all node datapoints (from §9 of project brief)
- [ ] Bandwidth and utilization calculated per link and per switch
- [ ] PTP design fields on Grandmaster and Switch nodes
- [ ] Violations displayed in UI (oversubscription, plane crossing)
- [ ] Project state persists in PostgreSQL
- [ ] Engineer can generate an HTML report
- [ ] Engineer can export a PDF report
- [ ] Docker Compose brings up full stack
