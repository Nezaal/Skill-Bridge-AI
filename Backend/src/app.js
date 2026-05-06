const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require('cors')


const app = express()


app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: [
        "http://localhost:5173", // Vite default local port
        "http://localhost:5000", // Vite default local port
        "https://skill-bridge-ai-production.up.railway.app",
        "https://skill-bridge-ai-lilac.vercel.app"
    ],
    credentials: true
}))

// require all routes here
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


// use all routes here
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)


module.exports = app