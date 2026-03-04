const express = require("express")
const authController = require("../controllers/auth.controller")
const loginUserController  = require("../controllers/auth.controller")


const authRouter =  express.Router()

/**
 * @route POST /api/auth/register
 * @desc regiseter a user
 * @aaccess Public
 */

authRouter.post("/register",authController.registerUserController   )


/**
 * @route POST /api/auth/login
 * @description login user with emal and pass
 * @access Public
 *
 */

authRouter.post("/login", authController.loginUserController)


module.exports = authRouter