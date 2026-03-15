require("dotenv").config();
const { generateInterviewReport } = require("./src/services/ai.service");
const { resume, selfDescription, jobDescription } = require("./src/services/temp");

async function testMode() {
    console.log("Generating report...");
    try {
        await generateInterviewReport({ resume, selfDescription, jobDescription });
        console.log("Done.");
    } catch (e) {
        console.error("Error running AI service:");
        console.error(e);
    }
}
testMode();
