const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    username :{
        type: String,
        unique: [true, "username already taken"],
        required: true,
    },

    email:{
        type: String,
        unique: [true, "email already exists"],
        required: true,
    },

    password:{
        type: String,
        required: false,
    },

    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },

    picture: {
        type: String,
    },

    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },

})

const userModel = mongoose.model("users", userSchema)

module.exports = userModel
