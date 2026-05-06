require("dotenv").config({ path: __dirname + "/.env" });
const { generateInterviewReport } = require("./src/services/ai.service");

async function test() {
    try {
        console.log("Starting test...");
        const report = await generateInterviewReport({
            resume: "I am a software engineer with 5 years of experience in React and Node.js.",
            selfDescription: "I love building scalable web applications.",
            jobDescription: "We are looking for a Senior Full Stack Developer proficient in React, Node.js, and MongoDB."
        });
        console.log("Success! Report:", report);
    } catch (error) {
        console.error("Failed! Error:", error);
    }
}

test();
