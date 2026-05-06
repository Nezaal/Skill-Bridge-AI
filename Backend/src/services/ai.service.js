const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

const interviewReportSchema = {
    type: Type.OBJECT,
    properties: {
        matchScore: {
            type: Type.INTEGER,
            description: "the match score between the candidate and the job description"
        },
        technicalQuestions: {
            type: Type.ARRAY,
            description: "list of technical questions that can be asked in the interview",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "the technical question" },
                    intention: { type: Type.STRING, description: "the intention behind the question" },
                    answer: { type: Type.STRING, description: "how to answer this question" },
                },
                required: ["question", "intention", "answer"]
            }
        },
        behaviourQuestions: {
            type: Type.ARRAY,
            description: "list of behavioural questions that can be asked in the interview",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "the behavioural question" },
                    intention: { type: Type.STRING, description: "the intention behind the question" },
                    answer: { type: Type.STRING, description: "how to answer this question" },
                },
                required: ["question", "intention", "answer"]
            }
        },
        skillGaps: {
            type: Type.ARRAY,
            description: "list of skill gaps",
            items: {
                type: Type.OBJECT,
                properties: {
                    skill: { type: Type.STRING, description: "the skill that is missing" },
                    severity: { type: Type.STRING, enum: ["low", "medium", "high"], description: "severity of the skill gap" },
                },
                required: ["skill", "severity"]
            }
        },
        preparationPlan: {
            type: Type.ARRAY,
            description: "A preparation plan to cover skill gaps",
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.INTEGER, description: "the day of the preparation plan" },
                    focus: { type: Type.STRING, description: "focus of the preparation plan" },
                    tasks: {
                        type: Type.ARRAY,
                        description: "the tasks to be done",
                        items: { type: Type.STRING }
                    }
                },
                required: ["day", "focus", "tasks"]
            }
        },
        title :{
            type : Type.STRING,
            description : "title of the interview"
        }
    },
    required: ["title", "technicalQuestions", "behaviourQuestions", "skillGaps", "preparationPlan"]
};

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `generate an interview report for the candidate based on the following information
    resume : ${resume}
    selfDescription : ${selfDescription}
    jobDescription : ${jobDescription}
    `

    const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewReportSchema,
        },
    });

    const result = JSON.parse(response.text)
    console.log(JSON.stringify(result, null, 2))
    return result
}


/**
 * Schema for resume HTML generation
 */
const resumeHTMLSchema = {
    type: Type.OBJECT,
    properties: {
        html: {
            type: Type.STRING,
            description: "Complete, self-contained HTML document for the resume with inline CSS. Must be a full HTML page with <!DOCTYPE html>, <html>, <head>, and <body> tags."
        }
    },
    required: ["html"]
};

/**
 * Generates a tailored resume as a complete HTML document using Gemini AI.
 * The HTML is designed to be rendered to PDF via Puppeteer.
 * @param {Object} params
 * @param {string} params.resume - The candidate's existing resume text
 * @param {string} params.selfDescription - The candidate's self description
 * @param {string} params.jobDescription - The target job description
 * @returns {Promise<string>} - Complete HTML string
 */
async function generateResumeHTML({ resume, selfDescription, jobDescription }) {

    const prompt = `You are an expert resume writer and frontend developer. Based on the following information, generate a **complete, self-contained HTML resume** that is tailored to the job description.

**REQUIREMENTS:**
- Output must be a COMPLETE HTML document (<!DOCTYPE html> to </html>)
- ALL CSS must be inline in a <style> tag in the <head> — NO external stylesheets or fonts
- Use system fonts only: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Design for A4 paper size (210mm × 297mm) — the HTML will be printed to PDF
- Use a clean, modern, professional layout with good visual hierarchy
- Include proper spacing, subtle section dividers, and readable typography
- Use a subtle color accent (dark navy #1a2332 for headers, #2563eb for accent highlights)
- Make it ATS-friendly: use semantic HTML, clear section headings, no complex layouts
- Extract and organize information from the resume into proper sections:
  • Header (name, contact info if available)
  • Professional Summary (tailored to the job)
  • Skills (relevant to the job description, organized by category)
  • Experience (from the resume)
  • Education (from the resume)
  • Any other relevant sections from the resume
- Tailor the content to emphasize skills and experience relevant to the job description
- Keep it to ONE page if possible, TWO pages maximum
- Do NOT use images, icons, or external resources

**CANDIDATE'S RESUME:**
${resume}

**CANDIDATE'S SELF DESCRIPTION:**
${selfDescription}

**TARGET JOB DESCRIPTION:**
${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: resumeHTMLSchema,
        },
    });

    const result = JSON.parse(response.text)
    return result.html
}

module.exports = { generateInterviewReport, generateResumeHTML }