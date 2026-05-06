require("dotenv").config({ path: __dirname + "/.env" });
const { GoogleGenAI } = require("@google/genai");

async function test() {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    try {
        const response = await ai.models.list();
        for await (const model of response) {
            console.log(model.name);
        }
    } catch (error) {
        console.error("Failed! Error:", error);
    }
}

test();
