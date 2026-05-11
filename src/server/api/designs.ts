import { Router } from 'express'
import { db } from '../db/connection.js'
import { projects, nodes, links, flows, designRevisions } from '../db/schema.js'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { createError } from '../middleware/errorHandler.js'
import { recomputeMetrics } from '../engines/index.js'
import type { DesignGraph } from '../../shared/types/design.js'
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/design.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router({ mergeParams: true })

/** GET /api/v1/projects/:id/design — return current live design state */
router.get('/', async (req, res, next) => {
  try {
    const projectId = (req.params as Record<string, string>)['id'] ?? ''
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
    if (!project || project.deletedAt) throw createError('Project not found', 404, 'NOT_FOUND')

    const projectNodes = await db.query.nodes.findMany({ where: eq(nodes.projectId, projectId) })
    const projectLinks = await db.query.links.findMany({ where: eq(links.projectId, projectId) })
    const projectFlows = await db.query.flows.findMany({ where: eq(flows.projectId, projectId) })

    const graph: DesignGraph = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      nodes: projectNodes.map((n) => ({
        id: n.id,
        nodeType: n.nodeType as DesignGraph['nodes'][0]['nodeType'],
        label: n.label,
        position: { x: n.positionX, y: n.positionY },
        properties: n.properties as Record<string, unknown>,
      })),
      links: projectLinks.map((l) => ({
        id: l.id,
        sourceNodeId: l.sourceNodeId,
        targetNodeId: l.targetNodeId,
        networkPlane: l.networkPlane as DesignGraph['links'][0]['networkPlane'],
        capacityMbps: l.capacityMbps,
        label: l.label ?? undefined,
        properties: l.properties as Record<string, unknown>,
      })),
      flows: projectFlows.map((f) => ({
        id: f.id,
        linkId: f.linkId,
        essenceType: f.essenceType as DesignGraph['flows'][0]['essenceType'],
        bandwidthMbps: f.bandwidthMbps,
        properties: f.properties as DesignGraph['flows'][0]['properties'],
      })),
    }

    res.json({ data: graph })
  } catch (err) {
    next(err)
  }
})

/**
 * PUT /api/v1/projects/:id/design — save design (replace all nodes/links/flows + create revision)
 * C1 decision: normalized tables updated atomically; JSONB snapshot written as revision.
 */
router.put('/', async (req, res, next) => {
  try {
    const projectId = (req.params as Record<string, string>)['id'] ?? ''
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
    if (!project || project.deletedAt) throw createError('Project not found', 404, 'NOT_FOUND')

    const graph = req.body as DesignGraph
    if (!graph?.nodes || !graph?.links) throw createError('Invalid design graph', 400, 'VALIDATION_ERROR')

    // Get next revision number
    const lastRevision = await db.query.designRevisions.findFirst({
      where: eq(designRevisions.projectId, projectId),
      orderBy: [desc(designRevisions.revisionNumber)],
    })
    const nextRevisionNumber = (lastRevision?.revisionNumber ?? 0) + 1

    // Atomic replacement of normalized tables + snapshot creation
    await db.transaction(async (tx) => {
      // Delete existing normalized data
      await tx.delete(flows).where(eq(flows.projectId, projectId))
      await tx.delete(links).where(eq(links.projectId, projectId))
      await tx.delete(nodes).where(eq(nodes.projectId, projectId))

      // Insert nodes
      if (graph.nodes.length > 0) {
        await tx.insert(nodes).values(
          graph.nodes.map((n) => ({
            id: n.id || uuidv4(),
            projectId,
            nodeType: n.nodeType,
            label: n.label,
            positionX: n.position.x,
            positionY: n.position.y,
            properties: n.properties,
          })),
        )
      }

      // Insert links
      if (graph.links.length > 0) {
        await tx.insert(links).values(
          graph.links.map((l) => ({
            id: l.id || uuidv4(),
            projectId,
            sourceNodeId: l.sourceNodeId,
            targetNodeId: l.targetNodeId,
            networkPlane: l.networkPlane,
            capacityMbps: l.capacityMbps,
            label: l.label,
            properties: l.properties,
          })),
        )
      }

      // Insert flows
      if (graph.flows && graph.flows.length > 0) {
        await tx.insert(flows).values(
          graph.flows.map((f) => ({
            id: f.id || uuidv4(),
            linkId: f.linkId,
            projectId,
            essenceType: f.essenceType,
            bandwidthMbps: f.bandwidthMbps,
            st2022_7Protected: (f.properties.st2022_7Protected as boolean | undefined) ?? false,
            senderType: (f.properties.senderType as string | undefined) ?? null,
            properties: f.properties,
          })),
        )
      }

      // Create immutable JSONB revision snapshot (C1 decision)
      await tx.insert(designRevisions).values({
        id: uuidv4(),
        projectId,
        revisionNumber: nextRevisionNumber,
        graph: graph,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      })

      // Mark metrics dirty
      await tx.update(projects).set({ metricsDirty: true, updatedAt: new Date() }).where(eq(projects.id, projectId))
    })

    // Trigger async metric recomputation
    recomputeMetrics(projectId).catch((err) => console.error('[design] Metric recompute failed:', err))

    res.json({ data: { revisionNumber: nextRevisionNumber, message: 'Design saved' } })
  } catch (err) {
    next(err)
  }
})

/** GET /api/v1/projects/:id/design/revisions — list revision history */
router.get('/revisions', async (req, res, next) => {
  try {
    const projectId = (req.params as Record<string, string>)['id'] ?? ''
    const revisions = await db.query.designRevisions.findMany({
      where: eq(designRevisions.projectId, projectId),
      orderBy: [desc(designRevisions.revisionNumber)],
      columns: { id: true, projectId: true, revisionNumber: true, schemaVersion: true, createdAt: true },
    })
    res.json({ data: revisions })
  } catch (err) {
    next(err)
  }
})

export default router
