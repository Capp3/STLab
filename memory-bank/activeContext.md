# ST Lab — Active Context

## Current phase: Idle (no active task)

**Last closed:** TASK-001 archived 2026-05-11 — see `memory-bank/archive/archive-TASK-001.md`.

**Next step:** Run **`/van`** when starting a new task so complexity, scope, and Memory Bank entries are refreshed for that work.

---

## Standing context (unchanged by archive)

- **Product:** Browser-hosted ST 2110–oriented system design tool; Node-RED–inspired UX; PostgreSQL system of record; first-class reporting.
- **Stack:** Node ≥22, Express, Drizzle + PostgreSQL, Vite + React + React Flow + Tailwind + Zustand; optional Redis; Puppeteer for PDF where available.
- **Research:** `research/*.md` remains source of truth for transport math — do not edit for app logic; implement derived behavior in `src/server/engines/`.

---

## Open product / engineering items (carry-forward)

These are **not** assigned to a task ID until the next `/van` / plan cycle:

- End-to-end QA and acceptance sign-off vs project brief §9.
- Automated tests (API, engines) and CI.
- Edge inspector persistence; AJV validation middleware.
- Normalize production `dist/` entry path if the nested layout is undesired.
