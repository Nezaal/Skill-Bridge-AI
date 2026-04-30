const { PDFParse } = require("pdf-parse")
const { generateInterviewReport } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")


async function generateInterviewReportController(req, res) {
    const resumeFile = req.file

    const parser = new PDFParse({ data: resumeFile.buffer })
    const resumeContent = await parser.getText()
    await parser.destroy()
    const { selfDescription, jobDescription } = req.body


    const interviewReportByAi = await generateInterviewReport({
        resume: resumeContent.text,
        selfDescription,
        jobDescription
    })


    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
        ...interviewReportByAi
    })

    return res.status(200).json({
        success: true,
        message: "Interview report generated successfully",
        data: interviewReport
    })
}


module.exports = generateInterviewReportController