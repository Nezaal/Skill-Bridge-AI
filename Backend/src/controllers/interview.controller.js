const { PDFParse, VerbosityLevel } = require("pdf-parse")
const { generateInterviewReport, generateResumeHTML } = require("../services/ai.service")
const { generatePDFFromHTML } = require("../services/pdf.service")
const { computeMatchScore } = require("../services/ats.service")
const interviewReportModel = require("../models/interviewReport.model")

async function preRenderResumePdf(interviewReportId, resumeHTML) {
    try {
        const pdfBuffer = await generatePDFFromHTML(resumeHTML)
        await interviewReportModel.findByIdAndUpdate(interviewReportId, {
            resumePDF: pdfBuffer,
            resumePdfStatus: "ready"
        })
    } catch (error) {
        console.error("Background resume PDF generation failed:", error.message)
        await interviewReportModel.findByIdAndUpdate(interviewReportId, {
            resumePdfStatus: "failed"
        }).catch(() => {})
    }
}

/**
 * @description controller for generating interview report
 *  
 */

async function generateInterviewReportController(req, res) {
    try {
        const resumeFile = req.file

        if (!resumeFile) {
            return res.status(400).json({
                success: false,
                message: "Resume file is required"
            })
        }

        // Step 1: Parse PDF
        let resumeText

        try {
            const parser = new PDFParse({ data: resumeFile.buffer, verbosity: VerbosityLevel.ERRORS })
            await parser.load()
            const resumeContent = await parser.getText()
            resumeText = resumeContent.text
            await parser.destroy()
        } catch (pdfError) {
            console.error("PDF parsing error:", pdfError.message)
            return res.status(400).json({
                success: false,
                message: "Failed to parse the PDF file. Please ensure you upload a valid PDF.",
                error: pdfError.message
            })
        }

        const { selfDescription, jobDescription } = req.body

        // --- Input validation ---
        const MIN_LENGTH = 20

        if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < MIN_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `Job description must be at least ${MIN_LENGTH} characters and contain a meaningful description.`
            })
        }

        if (!selfDescription || typeof selfDescription !== 'string' || selfDescription.trim().length < MIN_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `Self description must be at least ${MIN_LENGTH} characters and contain a meaningful description.`
            })
        }

        // Basic gibberish detection: real English text has a reasonable vowel ratio
        const isGibberish = (text) => {
            const letters = text.replace(/[^a-zA-Z]/g, '')
            if (letters.length < 10) return true
            const vowels = letters.replace(/[^aeiouAEIOU]/g, '').length
            const vowelRatio = vowels / letters.length


            // Normal English has ~35-45% vowels; gibberish typically has <15%
            return vowelRatio < 0.15
        }

        if (isGibberish(jobDescription)) {
            return res.status(400).json({
                success: false,
                message: "Job description doesn't appear to contain valid text. Please enter a real job description."
            })
        }

        if (isGibberish(selfDescription)) {
            return res.status(400).json({
                success: false,
                message: "Self description doesn't appear to contain valid text. Please enter a real self description."
            })
        }

        const [atsResult, interviewReportByAi, resumeHTML] = await Promise.all([
            computeMatchScore(resumeText, jobDescription),
            generateInterviewReport({
                resume: resumeText,
                selfDescription,
                jobDescription
            }),
            generateResumeHTML({
                resume: resumeText,
                selfDescription,
                jobDescription
            }).catch((error) => {
                console.error("Resume HTML generation failed:", error.message)
                return null
            })
        ])

        interviewReportByAi.matchScore = atsResult.score
        interviewReportByAi.missingSkills = atsResult.missingSkills


        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            title: interviewReportByAi.title || "Software Engineering Interview",
            resumeHTML,
            resumePdfStatus: resumeHTML ? "pending" : "none",
            ...interviewReportByAi
        })

        if (resumeHTML) {
            setImmediate(() => preRenderResumePdf(interviewReport._id, resumeHTML))
        }

        return res.status(200).json({
            success: true,
            message: "Interview report generated successfully",
            data: interviewReport
        })
    } catch (error) {
        console.error("Error generating interview report:", error)
        return res.status(500).json({
            success: false,
            message: "Failed to generate interview report",
            error: error.message
        })
    }
}


/**
 * @descrription controller for generating interview report by id
 * 
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({
        _id: interviewId,
        user: req.user.id
    })

    if (!interviewReport) {
        return res.status(404).json({
            message: "interview report not found"
        })
    }

    return res.status(200).json({
        success: true,
        message: "Interview report fetched successfully",
        data: interviewReport
    })

}


/**
 * @description get interview reports for all logged in users
 */
async function getAllInterviewReportsController(req, res) {

    const interviewReports = await interviewReportModel.find({
        user: req.user.id,

    }).sort({
        createdAt: -1
    }).select("-resume -jobDescription -selfDescription -_v -updatedAt -technicalQuestions -behaviourQuestions -skillGaps -preparationPlan -resumeHTML -resumePDF")

    return res.status(200).json({
        success: true,
        message: "Interview reports fetched successfully",
        data: interviewReports
    })
}


/**
 * @description Generate a tailored resume PDF from an existing interview report
 * Pipeline: Fetch report → AI generates HTML resume → Puppeteer renders to PDF → Stream to client
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        // Step 1: Fetch the interview report and validate ownership
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                success: false,
                message: "Interview report not found"
            })
        }

        const fileName = `Resume_${interviewReport.title || "SkillBridge"}.pdf`

        const streamPdf = (pdfBuffer) => {
            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
                "Content-Length": pdfBuffer.length
            })
            return res.send(pdfBuffer)
        }

        // Fast path 1: pre-rendered PDF already stored during report generation
        if (interviewReport.resumePDF) {
            console.log("Serving pre-rendered resume PDF...")
            return streamPdf(interviewReport.resumePDF)
        }

        // Fast path 2: stored HTML → render on demand (skips the Gemini call)
        if (interviewReport.resumeHTML) {
            console.log("Rendering resume PDF from stored HTML...")
            const pdfBuffer = await generatePDFFromHTML(interviewReport.resumeHTML)
            interviewReportModel.findByIdAndUpdate(interviewReport._id, {
                resumePDF: pdfBuffer,
                resumePdfStatus: "ready"
            }).catch(() => {})
            return streamPdf(pdfBuffer)
        }

        // Fallback: full on-demand generation (legacy path)
        console.log("Generating resume HTML via AI...")
        const resumeHTML = await generateResumeHTML({
            resume: interviewReport.resume,
            selfDescription: interviewReport.selfDescription || "",
            jobDescription: interviewReport.jobDescription
        })

        console.log("Converting HTML to PDF via Puppeteer...")
        const pdfBuffer = await generatePDFFromHTML(resumeHTML)

        return streamPdf(pdfBuffer)

    } catch (error) {
        console.error("Error generating resume PDF:", error)
        return res.status(500).json({
            success: false,
            message: "Failed to generate resume PDF",
            error: error.message
        })
    }
}


module.exports = {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
}