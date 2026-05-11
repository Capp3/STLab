import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDb, connectRedis } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import projectsRouter from './api/projects.js';
import designsRouter from './api/designs.js';
import metricsRouter from './api/metrics.js';
import reportsRouter from './api/reports.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env['PORT'] ?? 3000);
app.use(cors({ origin: process.env['NODE_ENV'] === 'production' ? false : 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
});
// API routes
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/projects/:id/design', designsRouter);
app.use('/api/v1/projects/:id/metrics', metricsRouter);
app.use('/api/v1/projects/:id/reports', reportsRouter);
app.use('/api/v1/reports', reportsRouter);
// Serve static client in production
if (process.env['NODE_ENV'] === 'production') {
    const clientDist = path.resolve(__dirname, '../../dist/client');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}
app.use(notFound);
app.use(errorHandler);
async function start() {
    await connectDb();
    await runMigrations();
    await connectRedis();
    app.listen(PORT, () => {
        console.log(`[server] ST Lab running at http://localhost:${PORT}`);
    });
}
start().catch((err) => {
    console.error('[server] Fatal startup error:', err);
    process.exit(1);
});
