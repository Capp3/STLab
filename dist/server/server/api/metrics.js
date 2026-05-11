import { Router } from 'express';
import { db } from '../db/connection.js';
import { projects, derivedMetrics, violations } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { createError } from '../middleware/errorHandler.js';
import { recomputeMetrics } from '../engines/index.js';
const router = Router({ mergeParams: true });
/** GET /api/v1/projects/:id/metrics */
router.get('/', async (req, res, next) => {
    try {
        const projectId = req.params['id'] ?? '';
        const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
        if (!project || project.deletedAt)
            throw createError('Project not found', 404, 'NOT_FOUND');
        // If dirty, trigger recompute before returning
        if (project.metricsDirty) {
            await recomputeMetrics(projectId);
        }
        const metrics = await db.query.derivedMetrics.findMany({ where: eq(derivedMetrics.projectId, projectId) });
        const projectViolations = await db.query.violations.findMany({ where: eq(violations.projectId, projectId) });
        res.json({
            data: {
                metrics,
                violations: projectViolations,
                summary: {
                    errorCount: projectViolations.filter((v) => v.severity === 'error').length,
                    warningCount: projectViolations.filter((v) => v.severity === 'warning').length,
                    metricsDirty: false,
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
/** POST /api/v1/projects/:id/metrics/recompute — force recompute */
router.post('/recompute', async (req, res, next) => {
    try {
        const projectId = req.params['id'] ?? '';
        const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
        if (!project || project.deletedAt)
            throw createError('Project not found', 404, 'NOT_FOUND');
        await recomputeMetrics(projectId);
        res.json({ data: { message: 'Metrics recomputed' } });
    }
    catch (err) {
        next(err);
    }
});
export default router;
