const express = require("express")
const authController = require("../controllers/auth.controller")
const loginUserController  = require("../controllers/auth.controller")
const logoutUserController = require("../controllers/auth.controller")
const authMiddleware = require("../middlewares/auth.middleware")  
const getMeController = require("../controllers/auth.controller")


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

/**
 * @toute GET /API/AUTH/LOGOUT
 * @DESCRIPTION clear token from userr cookie and add the token n blacklist
 * @access Pblic  
 */
authRouter.get("/logout", authController.logoutUserController)

/**
 * @route GET /api/auth/me
 * @description get current logged in user
 * @access Private
 */

authRouter.get("/get-me", authMiddleware.authUser,authController.getMeController
)

module.exports = authRouter