const express = require("express")
const { authUser } = require("../middlewares/auth.middleware")
const generateInterviewReportController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()

interviewRouter.post("/", authUser,
    upload.single("resume"),
    generateInterviewReportController
)

module.exports = interviewRouter