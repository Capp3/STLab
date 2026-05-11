# Creative Phase: C1 — Design Document Versioning Model

**Type:** Architecture Design  
**Status:** DECIDED  
**Date:** 2026-05-11

## Decision

**Hybrid: Normalized Live Tables + JSONB Archive Snapshot on Save**

## Options Considered

| Option | Approach | Key Trade-off |
|--------|----------|---------------|
| A | JSONB whole-graph snapshot only | Simple writes; poor SQL reporting |
| B | Normalized node/link tables only | Great queries; complex revision freeze semantics |
| **C (Chosen)** | **Normalized live + JSONB snapshot on Save** | **Best of both; slight write complexity** |

## Architecture

```
Current working state (editable):
  nodes  table: { id, project_id, node_type, label, position_x, position_y, properties JSONB }
  links  table: { id, project_id, source_node_id, target_node_id, network_plane, capacity_mbps, properties JSONB }
  flows  table: { id, link_id, essence_type, bandwidth_mbps, properties JSONB }

Committed revision history (immutable):
  design_revisions: { id, project_id, revision_number, graph JSONB, schema_version, created_at }
  -- graph JSONB uses DesignGraph type shape (same as client state format)
```

## Rules

1. **Normalized tables = source of truth** for current design state
2. **JSONB snapshot = derived record** created on every explicit Save operation
3. On conflict between JSONB snapshot and normalized tables: normalized tables win
4. Report generation queries normalized tables (fast, indexable, typed)
5. Historical report reproduction loads the JSONB snapshot and re-runs engines
6. Schema version field on `design_revisions` enables future migrations of old snapshots

## Save Flow

```
User clicks Save →
  BEGIN TRANSACTION
    1. Upsert nodes rows (delete removed, insert/update existing)
    2. Upsert links rows
    3. Upsert flows rows
    4. Serialize current state → DesignGraph JSONB
    5. INSERT design_revisions (new revision_number = last + 1)
    6. Trigger metric recomputation (async)
  COMMIT
```

## Implementation Notes

- `DesignGraph` type in `src/shared/types/design.ts` is the canonical graph shape (client ↔ server ↔ snapshot)
- Metric invalidation: any write to normalized tables sets `metrics_dirty = true` on the project
- Revision comparison: diff two `graph` JSONB values using JSON diff library (Phase 2+)
