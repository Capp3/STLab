/**
 * PDF generation via Puppeteer.
 * Gracefully unavailable if Puppeteer/Chromium is not installed.
 */
export async function generatePdf(html: string, outputPath: string): Promise<void> {
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html)
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    })
  } finally {
    await browser.close()
  }
}
