const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")



const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

const interviewReportSchema = z.object({
    technicalQuestions: z.array(z.object({
        question: z.string().describe("the technical question that can be asked in the interview"),
        intention: z.string().describe("the intention behind the question"),
        answer: z.string().describe("how to answer this question what approach to take, what things to highlight etc..."),

    })).describe("list of technical questions that can be asked in the interview along with their intention and how to answer them"),


    behaviourQuestions: z.array(z.object({
        question: z.string().describe("the behavioural question that can be asked in the interview"),
        intention: z.string().describe("the intention behind the question"),
        answer: z.string().describe("how to answer this question what approach to take, what things to highlight etc..."),
    })).describe("list of behavioural questions that can be asked in the interview along with their intention and how to answer them"),


    skillGaps: z.array(z.object({
        skill: z.string().describe("the skill that is missing in the candidate"),
        severity: z.enum(["low", "medium", "high"]).describe("the severity of the skill gap"),
    })).describe("list of skill gaps in the candidate profile along with their severity"),


    preparationPlan: z.array(z.object({
        day: z.number().describe("the day of the preparation plan starts from 1 decide the number of days based on the skill gaps and the job description"),
        focus: z.string().describe("the focus of the preparation plan"),
        tasks: z.string().describe("the tasks to be done in the preparation plan"),
    })).describe("A preparation plan for the candidate to prepare for the interview in accordance with the skill gaps and the job description. if the job match score isnt 100% alwats provide a preparation plan to cover the skill gaps and the job description ")


})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `generate an interview report for the candidate based on the following information
    resume : ${resume}
    selfDescription : ${selfDescription}
    jobDescription : ${jobDescription}
    `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        },
    });

    console.log(JSON.parse(response.text))
}


module.exports = { generateInterviewReport }