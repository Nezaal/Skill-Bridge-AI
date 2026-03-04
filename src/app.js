const express = require("express")


const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// require all routes here
const authRouter = require("./routes/auth.routes")

// use all routes here
app.use("/api/auth", authRouter)


module.exports = app