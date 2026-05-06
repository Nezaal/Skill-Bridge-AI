const mongoose = require("mongoose");

/**
 * job desc schema
 * resume text
 * self desc
 * 
 * tech ques array: [{ques,
 *                      ans,
 *                      intention,
 *                      }]
 * behaviour ques array: [{ques,
 *                      ans,
 *                      intention,
 *                      }]
 * skill gaps : [{
 *                  skill,
 *                  severity{
 *                  type : string,
 *                  enum : ["low", "medium", "high"]
 *                }  
 *                  }
 *                  
 *                      }]
 * preparation plan [{
 *                  
 * 
 *     }]
 * 
 */

const technicalQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Question is required"]
    },
    answer: {
        type: String,
        required: [true, "Answer is required"]
    },
    intention: {
        type: String,
        required: [true, "Intention is required"]
    }
}, {
    _id: false
})


const behaviourQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Question is required"]
    },
    answer: {
        type: String,
        required: [true, "Answer is required"]
    },
    intention: {
        type: String,
        required: [true, "Intention is required"]
    }
}, {
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [true, "Skill is required"]
    },
    severity: {
        type: String,
        required: [true, "Severity is required"],
        enum: ["low", "medium", "high"]
    }
}, {
    _id: false
})

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [true, "Day is required"]
    },
    focus: {
        type: String,
        required: [true, "Focus is required"]
    },
    tasks: {
        type: [String],
        required: [true, "Tasks are required"]
    }
}, {
    _id: false
})



const interviewReportSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: [true, "jon Description is required"]

    },
    resume: {
        type: String,
        required: [true, "Resume is required"]
    },
    selfDescription: {
        type: String,
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    technicalQuestions: [technicalQuestionSchema],

    behaviourQuestions: [behaviourQuestionSchema],

    skillGaps: [skillGapSchema],

    preparationPlan: [preparationPlanSchema],

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"]
    },
    title :{
        type : String,
        required : [true, "Jobtitle is required"]  
    }

}, {
    timestamps: true
})


const interviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);

module.exports = interviewReportModel
