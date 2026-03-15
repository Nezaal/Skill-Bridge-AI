require("dotenv").config();
const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

async function run() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a profile for John Doe",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        age: { type: Type.INTEGER }
                    },
                    required: ["name", "age"]
                }
            },
        });
        console.log(response.text);
    } catch (e) {
        console.error(e);
    }
}
run();
