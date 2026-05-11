import { runBandwidthEngine } from './bandwidth.js';
import { runPtpEngine } from './ptp.js';
import { db } from '../db/connection.js';
import { projects } from '../db/schema.js';
import { eq } from 'drizzle-orm';
/**
 * Recompute all metrics for a project.
 * Runs bandwidth engine then PTP engine.
 * Clears violations before bandwidth run; PTP engine appends.
 */
export async function recomputeMetrics(projectId) {
    console.log(`[engines] Recomputing metrics for project ${projectId}`);
    try {
        await runBandwidthEngine(projectId);
        await runPtpEngine(projectId);
        // Mark metrics as clean
        await db.update(projects).set({ metricsDirty: false, updatedAt: new Date() }).where(eq(projects.id, projectId));
        console.log(`[engines] Metrics complete for project ${projectId}`);
    }
    catch (err) {
        console.error(`[engines] Error computing metrics for ${projectId}:`, err);
        throw err;
    }
}
