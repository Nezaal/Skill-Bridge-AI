const puppeteer = require("puppeteer")

/**
 * Converts an HTML string into a PDF buffer using Puppeteer.
 * @param {string} htmlContent - Complete HTML string with inline CSS
 * @returns {Promise<Buffer>} - PDF as a Buffer
 */
async function generatePDFFromHTML(htmlContent) {
    let browser = null

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        })

        const page = await browser.newPage()

        await page.setContent(htmlContent, {
            waitUntil: "networkidle0",
        })

        // Emulate print media for clean PDF output
        await page.emulateMediaType("print")

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "0mm",
                right: "0mm",
                bottom: "0mm",
                left: "0mm",
            },
        })

        return Buffer.from(pdfBuffer)
    } catch (error) {
        console.error("Puppeteer PDF generation error:", error.message)
        throw new Error("Failed to generate PDF from HTML")
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}

module.exports = { generatePDFFromHTML }
