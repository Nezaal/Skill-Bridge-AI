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
        }
    },
    required: ["technicalQuestions", "behaviourQuestions", "skillGaps", "preparationPlan"]
};

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `generate an interview report for the candidate based on the following information
    resume : ${resume}
    selfDescription : ${selfDescription}
    jobDescription : ${jobDescription}
    `

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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

module.exports = { generateInterviewReport }