import { Router } from 'express'
import { db } from '../db/connection.js'
import { projects, nodes, links, violations } from '../db/schema.js'
import { eq, and, isNull, count, sql } from 'drizzle-orm'
import { createError } from '../middleware/errorHandler.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        metricsDirty: projects.metricsDirty,
      })
      .from(projects)
      .where(isNull(projects.deletedAt))
      .orderBy(projects.updatedAt)

    res.json({ data: rows })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body as { name?: string; description?: string }
    if (!name?.trim()) throw createError('Project name is required', 400, 'VALIDATION_ERROR')

    const [project] = await db
      .insert(projects)
      .values({ id: uuidv4(), name: name.trim(), description: description?.trim() })
      .returning()

    res.status(201).json({ data: project })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, (req.params as Record<string, string>)['id'] ?? '') })
    if (!project || project.deletedAt) throw createError('Project not found', 404, 'NOT_FOUND')

    const nodeCount = await db.select({ c: count() }).from(nodes).where(eq(nodes.projectId, project.id))
    const linkCount = await db.select({ c: count() }).from(links).where(eq(links.projectId, project.id))
    const violationRows = await db.select({ severity: violations.severity, c: count() })
      .from(violations)
      .where(eq(violations.projectId, project.id))
      .groupBy(violations.severity)

    const vcounts = { error: 0, warning: 0 }
    for (const r of violationRows) {
      if (r.severity === 'error') vcounts.error = Number(r.c)
      if (r.severity === 'warning') vcounts.warning = Number(r.c)
    }

    res.json({
      data: {
        ...project,
        nodeCount: Number(nodeCount[0]?.c ?? 0),
        linkCount: Number(linkCount[0]?.c ?? 0),
        violationCounts: vcounts,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, description } = req.body as { name?: string; description?: string }
    const existing = await db.query.projects.findFirst({ where: eq(projects.id, (req.params as Record<string, string>)['id'] ?? '') })
    if (!existing || existing.deletedAt) throw createError('Project not found', 404, 'NOT_FOUND')

    const [updated] = await db
      .update(projects)
      .set({
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, (req.params as Record<string, string>)['id'] ?? ''))
      .returning()

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await db.query.projects.findFirst({ where: eq(projects.id, (req.params as Record<string, string>)['id'] ?? '') })
    if (!existing || existing.deletedAt) throw createError('Project not found', 404, 'NOT_FOUND')

    await db.update(projects).set({ deletedAt: new Date() }).where(eq(projects.id, (req.params as Record<string, string>)['id'] ?? ''))
    res.json({ data: { id: req.params['id'] } })
  } catch (err) {
    next(err)
  }
})

export default router
