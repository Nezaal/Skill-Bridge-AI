const userModel = require("../models/user.model")
const blacklistTokenModel = require("../models/blacklist.models")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")


async function registerUserController(req, res) {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "please provide username , email and password"
        })
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or: [{ username }, { email }]
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "account already exists with this email "
        })
    }

    const hash = await bcrypt.hash(password, 10)
    const user = await userModel.create({
        username,
        email,
        password: hash,
    })

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
    )
    res.cookie("token", token, {
        httpOnly: true,
        // sameSite: "none",
        // secure: process.env.NODE_ENV === "production", 
    })

    res.status(201).json({
        message: "user registers successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    })
}




async function loginUserController(req, res) {
    const { email, password } = req.body

    const user = await userModel.findOne({ email })
    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid password"
        })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
    )

    res.cookie("token", token, {
        httpOnly: true,
        // sameSite: "none",
        // secure: process.env.NODE_ENV === "production", 
    })
    res.status(200).json({
        message: "user logged in successfully",

        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}

async function logoutUserController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (token) {
        await blacklistTokenModel.create({
            token
        })
    }

    res.clearCookie("token")
    res.status(200).json({
        message: "user logged out successfully"
    })
}

async function getMeController(req, res) {
    const user = await userModel.findById(req.user.id)

    res.status(200).json({
        message: "user details fetched successfuly",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}
module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}