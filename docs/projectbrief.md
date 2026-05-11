# ST Lab — Project Brief (Engineering Handoff)

**Document purpose:** Single source of truth for a development team implementing ST Lab. It expands the repository `readme.md` into product intent, domain requirements, interaction patterns, data/reporting expectations, and delivery phases.
**Primary standards context:** [SMPTE ST 2110](https://www.smpte.org/) professional media over IP.
**Repository:** [github.com/Capp3/STLab](https://github.com/Capp3/STLab)
**License (declared):** GNU General Public License v3.0
**Runtime baseline:** Node.js ≥ 22 (per `package.json` engines).

---

## 1. Executive summary

ST Lab is a **browser-hosted engineering application** for planning and documenting SMPTE ST 2110 systems before deployment. Users build **visual system diagrams** (nodes and links) that carry **structured engineering data**: essence flows, switch and link capacity, timing (PTP) considerations, and (over time) NMOS-oriented control-plane context.

**First-class outputs** are **reports** suitable for design review and implementation handoff alongside traditional schematics. The interaction model is intentionally aligned with **[Node-RED](https://nodered.org/)** (flow-style editor, palette of node types, connectable graph, inspect-able properties). **PostgreSQL** is the **system of record** so designs, revisions, metrics, and generated reports remain queryable, auditable, and scalable for a strong reporting component. **Redis** may be deployed **optionally** as a cache and acceleration layer (see §6.3); it does not replace Postgres for authoritative data.

Simulation and live orchestration are **out of scope for the initial delivery** but the architecture should not preclude them.

---

## 2. Problem statement

IP convergence places audio, video, timing, control, and management on shared (or related) network infrastructure. That makes **path tracing, capacity reasoning, and documentation** harder than in discrete-SDI-era designs. ST Lab reduces that friction by:

- Representing **equipment, essences, and network paths** in one coherent model.
- Surfacing **bandwidth and utilization** at links and switches.
- Supporting **multiple network planes** (media, PTP, NMOS/control, management) without collapsing unrelated traffic into a misleading single “wire.”
- Producing **engineering reports** grounded in the same model as the diagram.

---

## 3. Goals and non-goals

### 3.1 Goals

| Area          | Goal                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Audience      | Engineers designing or reviewing ST 2110 facilities and IP media networks.                                        |
| Workflow      | Engineering-first planning: model → validate → document.                                                          |
| Language      | SMPTE-oriented, **essence-centric** terminology in UI and reports.                                                |
| Visualization | Simple readable graph; rich underlying data (metadata and calculations, not decorative lines).                    |
| Topology      | Support simple and complex layouts from day one (including segmented / discrete fabrics).                         |
| Timing        | **PTP-aware design calculations** early; timing architecture choices evaluable during planning.                   |
| Reporting     | Reports are a **first-class** deliverable, backed by persisted structured data.                                   |
| Future fit    | Room for other IP media ecosystems (e.g. NDI, Dante) **without** breaking ST 2110 as the primary reference model. |

### 3.2 Non-goals (current phase)

- Replacement for production **NMS** or fleet monitoring tools.
- **Live** facility controller/orchestrator in phase 1.
- **Full real-time simulator** in phase 1 (simulation is a later phase; avoid designs that block it).
- Single fixed topology style only.

---

## 4. Delivery phases (product roadmap)

### Phase 1 — Design, traceability, reporting (MVP)

- Canvas-based **system diagram** with node palette and links.
- **Bandwidth and essence tracing** through the model (including per-link and per-switch views).
- **PTP engineering** calculations and fields sufficient for credible planning (see §8).
- **NMOS** represented at least as **design metadata** (devices, roles, specs) where the readme defines datapoints; live NMOS behavior can mature later.
- **Persistence** of projects and **report generation** from stored data (see §6).
- Deployment story: **Docker**-hosted web app (see §11).

### Phase 2 — Simulation (planned)

- Time-varying or scenario-based behavior (traffic, faults, degradation) where the domain model already anticipates snapshot-oriented bandwidth datapoints.
- Distinguish clearly in UI and storage between **design-time assumptions** vs **simulated or measured** values.

### Phase 3 — Deeper NMOS and control (planned)

- Progressive enhancement from documentation to optional **control-plane** features as requirements firm up.

---

## 5. Node-RED as the primary UX and architecture reference

The product owner intends to **follow Node-RED closely** for interaction patterns and several implementation conventions. The dev team should treat Node-RED as the **reference implementation** for:

| Concept               | Node-RED analogue                                           | ST Lab adaptation                                                                                            |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Flow document**     | Flow JSON (tabs, nodes, wires)                              | **Design document**: versioned graph + domain payloads + layout hints.                                       |
| **Editor**            | Palette, workspace, wiring, selection, keyboard affordances | **ST 2110 design editor** with domain-specific inspectors.                                                   |
| **Node**              | Typed node with `defaults`, credentials, ports              | **Equipment / role node** with ST Lab schema (see §9).                                                       |
| **Wire / link**       | Connection between node outputs/inputs                      | **Link** object: selectable, typed by **network plane**, multi-flow capable (see §9).                        |
| **Sidebar / info**    | Debug, context, help                                        | **Engineering panels**: bandwidth trace, PTP summary, violations, report preview.                            |
| **Runtime vs editor** | Separable concerns                                          | **Model service** (validation, aggregation, report queries) vs **editor UI**; both share a canonical schema. |

**Implementation note:** The repository `package.json` includes dependencies and tooling commonly associated with the Node-RED ecosystem (for example `node-red-admin`, Grunt-based pipelines, `mermaid`). The brief does **not** mandate forking Node-RED; it mandates **compatibility of mental model and, where practical, patterns** (document format, extensibility, deployment). The tech lead should decide: embed/fork vs inspired clean-room editor, based on licensing, maintenance, and ST Lab–specific graph rules.

---

## 6. Data platform and reporting (required)

**PostgreSQL-backed persistence** is a **core requirement**. Reports must be generated from **authoritative stored state** in Postgres, not only from in-memory editor models or from Redis alone.

### 6.1 Why PostgreSQL-backed persistence is mandatory

- **Revision history** of designs (who changed what, when) for engineering governance.
- **Snapshots** for bandwidth tracing over time (`readme.md` calls for time-aware datapoints).
- **Queryable aggregates** for reports: per-switch totals, per-plane utilization, worst-case paths, PTP domain summaries.
- **Separation of concerns**: long-running report generation, exports (PDF/HTML/structured attachments), and future simulation jobs should not depend on a single browser session.

### 6.2 Suggested logical data domains

| Domain                                      | Examples of persisted entities                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Identity & access**                       | Users/roles (if multi-user), API tokens, audit log (minimal in early internal deployments is acceptable).        |
| **Project**                                 | Project metadata, environments (e.g. staging vs as-built branches).                                              |
| **Design revision**                         | Immutable or versioned graph snapshots, schema version, editor layout.                                           |
| **Derived metrics**                         | Precomputed rollups per link/switch/node for fast reporting; invalidation on design change.                      |
| **Reports**                                 | Report definitions, generated artifacts, parameters used, timestamps.                                            |
| **Research / citations** (optional linkage) | Tie-out to internal `research/` outputs for “why this default” in calculators—keeps product honest to standards. |

### 6.3 Stack: PostgreSQL (required) and Redis (optional)

#### PostgreSQL — system of record

Postgres is the **mandated primary database**. All durable entities described in §6.2 (and the design graph) live here with **ACID transactions**, **schema migrations**, and **SQL** for reporting and ad hoc engineering queries.

- Use **JSON/JSONB** where graph payloads or extensible node properties benefit from schema flexibility, alongside normalized tables where reporting and constraints are clearer.
- **Large time-series** (simulation runs, dense bandwidth snapshots) may start in Postgres (partitioned tables or appropriate indexing); if volume later exceeds comfortable Postgres bounds, introduce a dedicated time-series store **without** demoting Postgres as the authority for design revisions and report metadata.
- **Large binary report artifacts** (PDF blobs) may remain in Postgres for small deployments; **S3-compatible object storage** remains an acceptable offload for bigger files, with Postgres holding pointers, checksums, and generation metadata.

#### Redis — optional cache and supporting services

Redis is **optional**. When enabled, it should sit **beside** Postgres, not as a second source of truth. Typical uses:

| Use                                   | Notes                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Derived metrics cache**             | Hot rollups (per-switch, per-link utilization) with TTL or explicit invalidation on design save. |
| **Session / rate limiting**           | If the API uses server-side sessions or gateway throttling.                                      |
| **Job coordination**                  | Locks, deduplication keys, or backing for a job queue consumer (implementation-specific).        |
| **Real-time / collaboration** (later) | Pub/sub or ephemeral presence; durable state still commits to Postgres.                          |

If Redis is unavailable, the application must **degrade gracefully** (slower paths or direct Postgres reads), except for features that explicitly require Redis when those features are turned on.

### 6.4 Reporting outputs (expectations)

- **Design summary:** inventory of nodes/links by type and plane.
- **Bandwidth budget:** per-link and per-switch tables; violations flagged.
- **PTP section:** grandmaster choice, domains, boundary/transparent roles on switches where modeled.
- **NMOS section:** device roles, spec levels, endpoints (as modeled).
- **Export formats:** at minimum **HTML** and **print-ready PDF**; structured **JSON/CSV** for downstream tools is desirable.

---

## 7. Core diagram model (authoritative semantics)

### 7.1 Readability vs fidelity

- Each **node** exposes **one visible attachment point by default** (simplified visual grammar).
- **Switches** connect to nodes on either side and to other switches/nodes.
- Each **visible link** is **directly selectable** and carries **metadata and calculations** (not decorative).
- **One visible link** may represent **multiple physical/logical paths** in the underlying model, while still enforcing **switch constraints** (device count, essence count, flow count, bandwidth).

### 7.2 Network planes

The model must support **discrete and parallel** network structures. Links belong to one or more **network planes** for correct tracing:

| Plane                   | Typical traffic                                  |
| ----------------------- | ------------------------------------------------ |
| Media essences          | ST 2110 essences                                 |
| PTP timing              | IEEE 1588 / ST 2059 considerations as applicable |
| NMOS / control          | IS-04 / IS-05 style control traffic (as modeled) |
| Management / monitoring | OAM, SNMP-like assumptions as design metadata    |

Tracing algorithms must **not** silently cross planes.

---

## 8. PTP engineering priority

PTP is a **primary motivator** for the product. Phase 1 must include **meaningful PTP-aware design fields and calculations** so timing architecture can be evaluated **during planning**.

Minimum expectations (align with node datapoints in §9.7 and switches in §9.5–9.6):

- Grandmaster parameters (class, accuracy, priorities, domain, intervals, delay mechanism, redundancy role).
- Switch **boundary / transparent clock** mode fields where relevant.
- Link-level **PTP presence** and **role reference** metadata for documentation and reports.

Detailed numeric engine requirements (e.g. full BC/TC chain analysis) can be staged, but the **data model and reporting hooks** should exist from the start.

---

## 9. Resource catalog — node and link schemas

The following tables consolidate `readme.md` **Resources** into an implementation-oriented checklist. Field names are indicative; the tech lead should map them to canonical JSON Schema / SQL columns.

### 9.1 Node types (palette)

| Type               | Intent                                                                           |
| ------------------ | -------------------------------------------------------------------------------- |
| Single Source      | One ST 2110 essence source.                                                      |
| Group Source       | Bundle of related essences/flows (e.g. multi-channel audio, multi-flow video).   |
| Single Destination | Single receive endpoint / flow consumer.                                         |
| Group Destination  | Multi-flow sink; flow mapping rules.                                             |
| Dedicated Switch   | Switch reserved for a domain; contention less central than capacity reservation. |
| Shared Switch      | Shared fabric; explicit contention and non-ST 2110 load modeling.                |
| Grandmaster Clock  | PTP grandmaster reference.                                                       |
| NMOS Device        | Control-plane device metadata and associations.                                  |

### 9.2 Single Source — datapoints

| Field              | Notes                                                          |
| ------------------ | -------------------------------------------------------------- |
| Name, ID           | Human label; stable identifier.                                |
| Device Type        | Equipment classification.                                      |
| Signal type        | Audio / video / combined selection as specified in product UX. |
| Bandwidth          | User-defined or calculated.                                    |
| Resolution         | Video context.                                                 |
| Video refresh rate | Video context.                                                 |
| Video bit depth    | Video context.                                                 |
| Audio bit depth    | Audio context.                                                 |
| Connection type    | Fibre/copper; 10G/100G (or extensible enum).                   |
| IP, MAC            | Optional.                                                      |

### 9.3 Group Source — datapoints

| Field                           | Notes                  |
| ------------------------------- | ---------------------- |
| Name, ID                        |                        |
| Device Type                     |                        |
| Signal type                     |                        |
| Number of essences/flows        |                        |
| Aggregate bandwidth             | Defined or calculated. |
| Member flow definitions         | Structured sub-model.  |
| Connection type                 |                        |
| IP range / multicast group, MAC | Optional.              |

### 9.4 Single Destination — datapoints

| Field                      | Notes     |
| -------------------------- | --------- |
| Name, ID                   |           |
| Device Type                |           |
| Accepted signal type       |           |
| Required bandwidth         |           |
| Resolution support         |           |
| Video refresh rate support |           |
| Video bit depth support    |           |
| Audio bit depth support    |           |
| Connection type            |           |
| IP, MAC                    | Optional. |

### 9.5 Group Destination — datapoints

| Field                           | Notes     |
| ------------------------------- | --------- |
| Name, ID                        |           |
| Device Type                     |           |
| Accepted signal type            |           |
| Number of destination flows     |           |
| Aggregate required bandwidth    |           |
| Flow mapping rules              |           |
| Connection type                 |           |
| IP range / multicast group, MAC | Optional. |

### 9.6 Dedicated Switch — datapoints

| Field                               | Notes                             |
| ----------------------------------- | --------------------------------- |
| Name, ID                            |                                   |
| Switch role                         | Dedicated.                        |
| Port count, port speeds             |                                   |
| Connected device count              | Derived or input with validation. |
| Flow/essence counts                 |                                   |
| Backplane capacity                  |                                   |
| Reserved bandwidth budget           |                                   |
| PTP boundary/transparent clock mode |                                   |
| Multicast support                   |                                   |
| Management IP                       | Optional.                         |

### 9.7 Shared Switch — datapoints

| Field                               | Notes                      |
| ----------------------------------- | -------------------------- |
| Name, ID                            |                            |
| Switch role                         | Shared.                    |
| Port count, port speeds             |                            |
| Connected device count              |                            |
| Flow/essence counts                 |                            |
| Backplane capacity                  |                            |
| Available bandwidth budget          | Contention-aware planning. |
| Existing non-ST 2110 load           |                            |
| QoS / priority profile              |                            |
| PTP boundary/transparent clock mode |                            |
| Multicast support                   |                            |
| Management IP                       | Optional.                  |

### 9.8 Grandmaster Clock — datapoints

| Field                            | Notes                |
| -------------------------------- | -------------------- |
| Name, ID                         |                      |
| Clock class, accuracy            |                      |
| Priority 1, Priority 2           |                      |
| Domain number                    |                      |
| Announce interval, sync interval |                      |
| Delay mechanism                  |                      |
| Redundancy role                  | Primary / secondary. |
| Management IP                    | Optional.            |

### 9.9 NMOS Device — datapoints

| Field                  | Notes                              |
| ---------------------- | ---------------------------------- |
| Name, ID               |                                    |
| Device role            |                                    |
| Supported NMOS specs   | e.g. IS-04, IS-05, etc.            |
| API endpoint           |                                    |
| Node/device identifier |                                    |
| Registration mode      |                                    |
| Authorization mode     |                                    |
| Associated media flows | References into media plane model. |
| Management IP          | Optional.                          |

### 9.10 Bandwidth tracing (time-aware) — datapoints

Support **per-node and per-link** series or snapshot rows for reporting and (later) simulation.

| Field                          | Notes                                                        |
| ------------------------------ | ------------------------------------------------------------ |
| Timestamp / snapshot time      |                                                              |
| Measured bandwidth (current)   | Design-time placeholder until simulation/measurement exists. |
| Peak bandwidth (windowed)      |                                                              |
| Reserved / available bandwidth |                                                              |
| Ingress / egress bandwidth     |                                                              |
| Total / active flow count      |                                                              |
| Essence type breakdown         | Audio / video / ANC / control.                               |
| Path / hop context             | Upstream, current, downstream identifiers.                   |
| Utilization %                  | Port and node level.                                         |
| Used bandwidth                 |                                                              |

### 9.11 Link behavior (UX + model)

- Directly selectable on canvas.
- Shows **source and destination** endpoints.
- Supports **multiple essences/flows** per link.
- Computes / displays **utilization** (live recompute in editor; persisted snapshots for reports).
- Highlights **protocol/context paths** (ST 2110 media, NMOS, PTP, management).

### 9.12 Link — datapoints

| Field                                        | Notes                                         |
| -------------------------------------------- | --------------------------------------------- |
| Link name, link ID                           |                                               |
| Link type                                    | Physical / logical.                           |
| Source node, source interface/port           |                                               |
| Destination node, destination interface/port |                                               |
| Network plane                                | Media / PTP / NMOS / management (extensible). |
| VLAN / subnet / VRF                          | Optional.                                     |
| Link capacity                                |                                               |
| Used / available bandwidth                   |                                               |
| Utilization %                                |                                               |
| Number of flows, number of essences          |                                               |
| Essence/flow type breakdown                  |                                               |
| NMOS presence                                | Yes/no + endpoint reference.                  |
| PTP presence                                 | Yes/no + role reference.                      |
| Latency                                      | Estimated vs measured (phase-dependent).      |
| Packet loss / error state                    | Simulation or measured (phase-dependent).     |
| Link status                                  | Up / down / degraded.                         |
| Medium                                       | Fibre / copper / virtual.                     |

### 9.13 Complex layouts

The link model must support **discrete parallel fabrics** (separate media, PTP, NMOS/API, management) with **non-crossing trace semantics** unless an explicit **bridging** construct is introduced later.

---

## 10. Example end-to-end scenario (acceptance narrative)

An engineer:

1. Creates a **new project** in ST Lab and models sources, destinations, switches, a **grandmaster**, and optional **NMOS devices**.
2. Connects equipment with **plane-aware links** and assigns **capacities** and **essence counts**.
3. Reviews **violations** (oversubscribed switch, link over 100% utilization, inconsistent PTP roles).
4. Runs a **report** from the server using persisted design state.
5. Exports the report for a **design review package** alongside conventional drawings.

---

## 11. Repository and engineering context (current state)

| Item                   | State                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Product specification  | `readme.md` is rich; this brief aligns and expands it.                                                                                          |
| Research               | `research/` holds citation-oriented prompts and reports feeding technical depth.                                                                |
| Application source     | **No application tree present yet** in-repo; implementation is greenfield beyond dependencies.                                                  |
| `package.json` scripts | Empty object at time of writing; **`npm start` is referenced by `Dockerfile` but not yet defined** — dev team must add a real entrypoint.       |
| Documentation site     | MkDocs configured (`mkdocs.yml`); GitHub Actions workflow builds and publishes docs (team should align `site_name` / nav with ST Lab branding). |
| Contributing           | See `.github/CONTRIBUTING.md` and issue/PR templates.                                                                                           |

---

## 12. Suggested engineering workstreams

| Workstream             | Outcome                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Schema & API**       | Canonical design JSON schema, versioning, REST or RPC API for save/load/report.                                                                                    |
| **Persistence**        | **PostgreSQL** schema, migrations, revision model, snapshot tables for metrics; **optional Redis** for cache/session/queue as adopted.                             |
| **Editor**             | Node-RED–like UX: palette, wiring, selection, validation feedback.                                                                                                 |
| **Calculation engine** | Bandwidth aggregation, switch rules, PTP summaries, extensible validators.                                                                                         |
| **Reporting**          | Server-side render pipeline, templates, PDF/HTML export, stable IDs in output.                                                                                     |
| **Authn/z**            | Decide minimal strategy for internal vs external deployments.                                                                                                      |
| **Ops**                | Docker Compose (app + **Postgres** + **optional Redis**), health checks, backup/restore for Postgres (and Redis RDB/AOF policy if used for non-rebuildable state). |

---

## 13. Open decisions for tech lead / product

1. **Node-RED reuse depth:** fork/embed vs inspired editor; impact on GPL strategy and upstream merges.
2. **Postgres hosting:** self-managed vs managed cloud; backup RPO/RTO targets; connection pooling (e.g. PgBouncer) if needed.
3. **Collaboration model:** single-user files vs multi-user concurrent editing (affects DB and sync).
4. **Simulation source of truth:** whether measured/simulated series supersede design assumptions in reports by default.
5. **NMOS scope in phase 1:** documentation-only vs any live registry interaction.

---

## 14. Glossary (short)

| Term          | Meaning in ST Lab                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Essence       | A logical media signal (audio/video/data) carried per ST 2110-style modeling.                     |
| Flow          | A network-level instantiation of essence(s) between endpoints; multiple may share a visible link. |
| Network plane | Traffic class separation (media, PTP, NMOS/control, management).                                  |
| NMOS          | AMWA NMOS family (e.g. IS-04/IS-05) as **modeled** control-plane context.                         |
| PTP           | Precision Time Protocol (IEEE 1588); timing design and clock roles.                               |

---

## 15. Related documents

| Path                   | Role                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `readme.md`            | Public-facing product overview and resource datapoint lists (canonical with this brief). |
| `research/readme.md`   | How citation-backed research supports technical truth in the product.                    |
| `research/report-*.md` | Topic reports (ST 2110, PTP, bandwidth, etc.) for engineering depth.                     |

---

_End of project brief._
