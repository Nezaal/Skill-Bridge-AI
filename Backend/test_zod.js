const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const interviewReportSchema = z.object({
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string(),
    })),
});

console.log(JSON.stringify(zodToJsonSchema(interviewReportSchema), null, 2));
