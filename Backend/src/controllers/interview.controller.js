const { PDFParse, VerbosityLevel } = require("pdf-parse")
const { generateInterviewReport, generateResumeHTML } = require("../services/ai.service")
const { generatePDFFromHTML } = require("../services/pdf.service")
const interviewReportModel = require("../models/interviewReport.model")

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

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeText,
                selfDescription,
                jobDescription
            })


        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interviewReportByAi
        })

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
async function getInterviewReportByIdController(req, res){

    const {interviewId} = req.params

    const interviewReport = await interviewReportModel.findOne({
        _id: interviewId,
        user : req.user.id
    }) 

    if(!interviewReport){
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
async function getAllInterviewReportsController(req, res){
    
    const interviewReports = await interviewReportModel.find({
        user: req.user.id,
 
    }).sort({
        createdAt: -1
    }).select("-resume -jobDescription -selfDescription -_v -updatedAt -techinalQuestions -behaviourQuestions -skillGaps -preparationPlan")

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

        // Step 2: Generate tailored resume HTML via AI
        console.log("Generating resume HTML via AI...")
        const resumeHTML = await generateResumeHTML({
            resume: interviewReport.resume,
            selfDescription: interviewReport.selfDescrption || "",
            jobDescription: interviewReport.jobDescription
        })

        // Step 3: Convert HTML to PDF via Puppeteer
        console.log("Converting HTML to PDF via Puppeteer...")
        const pdfBuffer = await generatePDFFromHTML(resumeHTML)

        // Step 4: Stream the PDF back to the client
        const fileName = `Resume_${interviewReport.title || "SkillBridge"}.pdf`

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Content-Length": pdfBuffer.length
        })

        return res.send(pdfBuffer)

    } catch (error) {
        console.error("Error generating resume PDF:", error)
        return res.status(500).json({
            success: false,
            message: "Failed to generate resume PDF",
            error: error.message
        })
    }
}


module.exports = {generateInterviewReportController, 
                getInterviewReportByIdController,
                getAllInterviewReportsController,
                generateResumePdfController
            }