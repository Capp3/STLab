import { pgTable, text, uuid, integer, real, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
/** Projects — top-level containers for designs */
export const projects = pgTable('projects', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    /** True when normalized tables have been edited since last metric compute */
    metricsDirty: boolean('metrics_dirty').default(true).notNull(),
    deletedAt: timestamp('deleted_at'),
});
/**
 * Nodes — live, normalized, source of truth for current design state.
 * C1 decision: normalized tables are primary; JSONB snapshot created on Save.
 */
export const nodes = pgTable('nodes', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
    nodeType: text('node_type').notNull(),
    label: text('label').notNull(),
    positionX: real('position_x').notNull().default(0),
    positionY: real('position_y').notNull().default(0),
    /** Extensible domain-specific properties per node type */
    properties: jsonb('properties').notNull().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
/** Links — plane-aware connections between nodes */
export const links = pgTable('links', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
    sourceNodeId: uuid('source_node_id')
        .notNull()
        .references(() => nodes.id, { onDelete: 'cascade' }),
    targetNodeId: uuid('target_node_id')
        .notNull()
        .references(() => nodes.id, { onDelete: 'cascade' }),
    /** Primary network plane for this link */
    networkPlane: text('network_plane').notNull().default('media'),
    /** Link capacity in Mbps */
    capacityMbps: real('capacity_mbps').notNull().default(10000),
    label: text('label'),
    properties: jsonb('properties').notNull().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
/**
 * Flows — essence/RTP flows traversing a link.
 * C2 decision: link-annotated; one row per essence flow per link.
 */
export const flows = pgTable('flows', {
    id: uuid('id').defaultRandom().primaryKey(),
    linkId: uuid('link_id')
        .notNull()
        .references(() => links.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
    essenceType: text('essence_type').notNull().default('video'),
    /** Calculated or user-defined bandwidth in Mbps */
    bandwidthMbps: real('bandwidth_mbps').notNull().default(0),
    /** ST 2022-7: this flow is part of a redundant pair (doubles BW budget) */
    st2022_7Protected: boolean('st2022_7_protected').default(false).notNull(),
    /** ST 2110-21 sender type: N / NL / W */
    senderType: text('sender_type'),
    properties: jsonb('properties').notNull().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
/**
 * Design revisions — immutable JSONB snapshots.
 * C1 decision: created on every explicit Save; historical reports replay from here.
 */
export const designRevisions = pgTable('design_revisions', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
    revisionNumber: integer('revision_number').notNull(),
    /** Full DesignGraph serialized as JSONB */
    graph: jsonb('graph').notNull(),
    schemaVersion: text('schema_version').notNull().default('1.0.0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
/** Derived metrics — computed by calculation engines, invalidated on design change */
export const derivedMetrics = pgTable('derived_metrics', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
    entityId: text('entity_id').notNull(),
    entityType: text('entity_type').notNull(),
    metricType: text('metric_type').notNull(),
    value: jsonb('value').notNull(),
    computedAt: timestamp('computed_at').defaultNow().notNull(),
});
/** Violations — cleared and re-computed on each metric run */
export const violations = pgTable('violations', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
    entityId: text('entity_id').notNull(),
    entityType: text('entity_type').notNull(),
    violationType: text('violation_type').notNull(),
    severity: text('severity').notNull(),
    message: text('message').notNull(),
    detail: jsonb('detail').notNull().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
/** Reports — generated HTML/PDF artifacts */
export const reports = pgTable('reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
    designRevisionId: uuid('design_revision_id').references(() => designRevisions.id),
    format: text('format').notNull().default('html'),
    status: text('status').notNull().default('pending'),
    artifactPath: text('artifact_path'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
