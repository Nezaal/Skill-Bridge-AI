require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

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

const schema = zodToJsonSchema(interviewReportSchema);
delete schema.$schema;

function uppercaseTypes(obj) {
    if (Array.isArray(obj)) {
        obj.forEach(uppercaseTypes);
    } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            if (key === 'type' && typeof obj[key] === 'string') {
                obj[key] = obj[key].toUpperCase();
            } else {
                uppercaseTypes(obj[key]);
            }
        }
    }
}
uppercaseTypes(schema);

async function run() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Make 1 simple dummy question",
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        console.log(response.text);
    } catch (e) {
        console.error(e);
    }
}
run();
