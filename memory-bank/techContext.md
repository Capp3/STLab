# ST Lab — Tech Context

## Existing Infrastructure (Already in Repo)

| Item | State |
|------|-------|
| `package.json` | Dependencies present (Express, Grunt, Node-RED-inspired tooling) — no `start` script yet |
| `Dockerfile` | Node Bullseye base, copies app, runs `npm start` — needs entrypoint defined |
| `compose.yml` | App + PostgreSQL 18 + Redis 7 defined; env vars for DB connection set |
| `docs/` | MkDocs site configured (`mkdocs.yml`); GitHub Actions workflow publishes docs |
| `research/` | Domain research reports — **source of truth, do not modify** |

## Chosen Stack (Architecture Decisions)

### Backend
- **Runtime:** Node.js ≥ 22 (LTS)
- **Framework:** Express.js (already in `package.json`)
- **Database ORM:** Drizzle ORM (TypeScript-first, close-to-SQL, migration support)
- **DB Driver:** `pg` (node-postgres)
- **Cache:** `ioredis` (optional, feature-gated)
- **Validation:** `ajv` (already in `package.json`)
- **Report generation:** `@puppeteer/core` for PDF; Mustache (already in `package.json`) for HTML templates

### Frontend
- **Framework:** React 18+
- **Canvas/Editor:** React Flow (Xyflow) — purpose-built for node-based editors
- **Build tool:** Vite
- **Styling:** Tailwind CSS
- **State management:** Zustand (lightweight, works well with React Flow)
- **Language:** TypeScript

### Project Structure
```
STLab/
├── src/
│   ├── client/              # React frontend (Vite)
│   │   ├── components/
│   │   │   ├── canvas/      # Flow editor (React Flow)
│   │   │   ├── palette/     # Node type palette sidebar
│   │   │   ├── inspector/   # Property inspector sidebar
│   │   │   └── panels/      # Engineering panels (BW, PTP, reports)
│   │   ├── nodes/           # Node type definitions + renderers
│   │   ├── store/           # Zustand state slices
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Calculation helpers (client-side)
│   └── server/              # Express backend
│       ├── api/             # REST route handlers
│       │   ├── projects.ts
│       │   ├── designs.ts
│       │   ├── nodes.ts
│       │   ├── links.ts
│       │   └── reports.ts
│       ├── db/              # Drizzle schema + connection
│       │   ├── schema.ts
│       │   ├── connection.ts
│       │   └── migrations/
│       ├── engines/         # Calculation engines (authoritative)
│       │   ├── bandwidth.ts
│       │   └── ptp.ts
│       ├── reports/         # Report generation pipeline
│       └── middleware/      # Auth, validation, error handling
├── migrations/              # Drizzle migration files
├── public/                  # Static assets
└── tests/                   # Mocha + Supertest tests
```

## Node-RED Dep Assessment

The existing `package.json` includes `node-red-admin` and Grunt-based tooling (inherited from project setup). For the clean-room editor approach:
- Keep Express, body-parser, cookie-parser, cors, express-session, passport (auth)
- Keep ajv (validation), js-yaml, mustache (templates), bcryptjs (auth)
- Keep mocha, sinon, supertest (test infrastructure)
- Add: React, React Flow, Vite, Tailwind, Zustand, Drizzle, pg, TypeScript

## Database Design Principles

- JSONB for extensible graph payloads and node properties
- Normalized tables for reporting-friendly aggregates
- Immutable design revisions (append-only snapshots)
- Migrations managed by Drizzle Kit
- Soft deletes where appropriate

## Environment Variables (from compose.yml)

```
DB_USER=stlab
DB_PASSWORD=stlab
DB_NAME=stlab
DB_HOST=stlab-db
DB_PORT=5432
REDIS_URL=redis://stlab-redis:6379  (optional)
```
