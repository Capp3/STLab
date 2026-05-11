import { Router } from 'express'
import { db } from '../db/connection.js'
import { projects, reports } from '../db/schema.js'
import { eq, isNull } from 'drizzle-orm'
import { createError } from '../middleware/errorHandler.js'
import { generateHtmlReport } from '../reports/generator.js'
import { recomputeMetrics } from '../engines/index.js'
import { v4 as uuidv4 } from 'uuid'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const router = Router({ mergeParams: true })
const REPORTS_DIR = process.env['REPORTS_DIR'] ?? './data/reports'

function ensureReportsDir(): void {
  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true })
}

/** POST /api/v1/projects/:id/reports — generate a report */
router.post('/', async (req, res, next) => {
  try {
    const projectId = (req.params as Record<string, string>)['id'] ?? ''
    const { format = 'html' } = req.body as { format?: string }

    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
    if (!project || project.deletedAt) throw createError('Project not found', 404, 'NOT_FOUND')

    if (!['html', 'pdf'].includes(format)) throw createError('format must be html or pdf', 400, 'VALIDATION_ERROR')

    // Ensure metrics are current
    if (project.metricsDirty) await recomputeMetrics(projectId)

    const reportId = uuidv4()
    const [report] = await db.insert(reports).values({
      id: reportId, projectId, format, status: 'generating',
    }).returning()

    // Generate HTML report
    ensureReportsDir()
    const html = await generateHtmlReport(projectId)
    const htmlPath = resolve(REPORTS_DIR, `${reportId}.html`)
    writeFileSync(htmlPath, html, 'utf-8')

    let finalPath = htmlPath
    let finalStatus = 'complete'

    // PDF generation (requires puppeteer)
    if (format === 'pdf') {
      try {
        const { generatePdf } = await import('../reports/pdf.js')
        const pdfPath = resolve(REPORTS_DIR, `${reportId}.pdf`)
        await generatePdf(html, pdfPath)
        finalPath = pdfPath
      } catch (pdfErr) {
        console.warn('[reports] PDF generation failed, returning HTML:', (pdfErr as Error).message)
        finalStatus = 'complete_html_fallback'
      }
    }

    await db.update(reports).set({ status: finalStatus, artifactPath: finalPath }).where(eq(reports.id, reportId))
    res.status(201).json({ data: { id: reportId, format, status: finalStatus } })
  } catch (err) {
    next(err)
  }
})

/** GET /api/v1/projects/:id/reports — list reports */
router.get('/', async (req, res, next) => {
  try {
    const projectId = (req.params as Record<string, string>)['id'] ?? ''
    const projectReports = await db.query.reports.findMany({ where: eq(reports.projectId, projectId) })
    res.json({ data: projectReports })
  } catch (err) {
    next(err)
  }
})

/** GET /api/v1/reports/:reportId/download */
router.get('/:reportId/download', async (req, res, next) => {
  try {
    const report = await db.query.reports.findFirst({ where: eq(reports.id, (req.params as Record<string, string>)['reportId'] ?? '') })
    if (!report || !report.artifactPath) throw createError('Report not found or not ready', 404, 'NOT_FOUND')

    if (!existsSync(report.artifactPath)) throw createError('Report file not found', 404, 'NOT_FOUND')

    const contentType = report.format === 'pdf' ? 'application/pdf' : 'text/html'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="stlab-report-${report.id}.${report.format}"`)
    res.sendFile(resolve(report.artifactPath))
  } catch (err) {
    next(err)
  }
})

export default router
