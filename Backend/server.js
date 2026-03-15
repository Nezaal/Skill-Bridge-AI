require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")
const { generateInterviewReport } = require("./src/services/ai.service")
const { resume, selfDescription, jobDescription } = require("./src/services/temp")
connectToDB()



app.listen(3000, () => {
    console.log("server running on port 3000")
})

// generateInterviewReport({ resume, selfDescription, jobDescription })