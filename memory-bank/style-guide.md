# ST Lab — Style Guide

## Language & Terminology

Always use SMPTE-oriented, essence-centric language in UI, reports, and code:

| Use              | Avoid                                        |
| ---------------- | -------------------------------------------- |
| Essence          | Signal (when referring to media content)     |
| Flow             | Stream (when referring to RTP transport)     |
| Node             | Device (in diagram context)                  |
| Link             | Wire / Cable (in diagram context)            |
| Network Plane    | Layer / Domain                               |
| Grandmaster      | Master Clock                                 |
| Dedicated Switch | Spine Switch (for ST 2110–reserved switches) |
| Shared Switch    | Core Switch (for mixed-traffic switches)     |

## Code Conventions

- **TypeScript everywhere** — no untyped `any` without justification and comment
- **Named exports** preferred over default exports for components and utilities
- **File naming:** kebab-case for files, PascalCase for React components, camelCase for utilities
- **Interfaces over types** for object shapes with documentation significance
- **No magic numbers** — constants must be named and sourced (reference research report where applicable)

## UI Design Principles

- Engineering-first: density over decorativeness
- Dark editor canvas (like Node-RED) with neutral panel backgrounds
- Node colors by category:
  - Sources: blue (`#3B82F6`)
  - Destinations: green (`#10B981`)
  - Switches — Dedicated: purple (`#8B5CF6`)
  - Switches — Shared: orange (`#F59E0B`)
  - Grandmaster: yellow (`#EAB308`)
  - NMOS Device: cyan (`#06B6D4`)
- Violations: red badges (`#EF4444`), warnings: amber (`#F59E0B`)
- Network plane indicator: colored border/tag on links
  - Media: blue
  - PTP: yellow
  - NMOS: cyan
  - Management: gray

## API Conventions

- All routes under `/api/v1/`
- Consistent response envelope:
  ```json
  { "data": { ... }, "meta": { "timestamp": "...", "version": "1" } }
  ```
- Errors:
  ```json
  { "error": { "code": "BANDWIDTH_EXCEEDED", "message": "...", "detail": {} } }
  ```
- Use HTTP status codes correctly (200, 201, 400, 404, 409, 500)

## Database Conventions

- Table names: `snake_case`, plural
- Column names: `snake_case`
- Primary keys: UUID v4 as `id`
- Timestamps: `created_at`, `updated_at` on all tables
- Soft deletes where applicable: `deleted_at`
- JSONB columns: `properties` (extensible node/link data), `payload` (raw graph data)

## Calculation Conventions

- Bandwidth in **Megabits per second (Mbps)** internally
- Utilization as a **decimal 0–1** internally, percentage in UI
- PTP intervals in **log2 seconds** (as per IEEE 1588 convention)
- All calculations cite the source rule from `research/report-*.md`
