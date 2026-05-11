# ST Lab — Project Brief Summary (Memory Bank)

**Source of truth:** `docs/projectbrief.md` and `readme.md`
**Research source of truth:** `research/report-*.md` (DO NOT EDIT)

## What ST Lab Is

A **browser-hosted engineering application** for planning and documenting SMPTE ST 2110 systems before deployment. Engineers build visual system diagrams (nodes and links) carrying structured engineering data: essence flows, switch/link capacity, PTP timing, and NMOS control-plane context.

## Primary Output

Engineering **reports** suitable for design review and implementation handoff.

## Interaction Model

Node-RED–inspired: flow-style editor, palette of node types, connectable graph, inspectable properties.

## Technology Foundation

- **Runtime:** Node.js ≥ 22
- **Database:** PostgreSQL (mandatory system of record)
- **Cache:** Redis (optional, graceful degradation)
- **Deployment:** Docker (Docker Compose)
- **License:** GNU GPL v3.0

## Delivery Phases

| Phase   | Focus                                                                                                     |
| ------- | --------------------------------------------------------------------------------------------------------- |
| 1 (MVP) | Design canvas, bandwidth/essence tracing, PTP calculations, NMOS metadata, persistence, report generation |
| 2       | Simulation (time-varying/scenario behavior)                                                               |
| 3       | Deeper NMOS, control-plane features                                                                       |

## Node Types (Palette)

Single Source, Group Source, Single Destination, Group Destination, Dedicated Switch, Shared Switch, Grandmaster Clock, NMOS Device

## Network Planes

Media essences, PTP timing, NMOS/control, Management/monitoring

## Key Constraints

- Reports from authoritative PostgreSQL state (not in-memory only)
- PTP-aware design calculations from day one
- Plane-aware link tracing (no silent plane crossing)
- One visible link may represent multiple physical paths
- Research reports are the math/standards source of truth — use them, do not edit them
