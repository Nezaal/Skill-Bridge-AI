require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

const interviewReportSchema = z.object({
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string(),
    })),
});

async function run() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Make 1 simple dummy question",
            config: {
                responseMimeType: "application/json",
                responseSchema: interviewReportSchema,
            },
        });
        console.log(response.text);
    } catch (e) {
        console.error(e);
    }
}
run();
