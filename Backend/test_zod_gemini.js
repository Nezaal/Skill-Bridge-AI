require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

const interviewReportSchema = z.object({
    technicalQuestions: z.array(z.object({
        question: z.string().describe("the technical question that can be asked in the interview"),
        intention: z.string().describe("the intention behind the question"),
        answer: z.string().describe("how to answer this question what approach to take, what things to highlight etc..."),
    })).describe("list of technical questions that can be asked in the interview along with their intention and how to answer them"),
});

const schema = zodToJsonSchema(interviewReportSchema);
delete schema.$schema;

async function run() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Make 1 simple dummy question",
            config: {
                responseMimeType: "application/json",
                // Passing the modified json schema directly
                responseSchema: schema,
            },
        });
        console.log(response.text);
    } catch (e) {
        console.error(e);
    }
}
run();
