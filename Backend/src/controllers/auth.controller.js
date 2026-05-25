const userModel = require("../models/user.model")
const blacklistTokenModel = require("../models/blacklist.models")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function createAppToken(user) {
    return jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )
}

function setAuthCookie(res, token) {
    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
    })
}

function createProviderUsername(name, fallbackEmail, providerId, fallbackPrefix) {
    const baseUsername = (name || fallbackEmail.split("@")[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 24) || fallbackPrefix

    return `${baseUsername}_${String(providerId).slice(-6)}`
}

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
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
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

    if (!user.password) {
        return res.status(400).json({
            message: "Please sign in with Google"
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
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
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

    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
    })
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
async function googleLoginController(req, res) {
    try {
        const idToken = req.body.credential || req.body.token || req.body.idToken

        if (!idToken) {
            return res.status(400).json({
                message: "Google credential is required"
            })
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({
                message: "Google client id is not configured"
            })
        }

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        })

        const payload = ticket.getPayload()
        const { email, name, picture, sub: googleId } = payload

        if (!email || !googleId) {
            return res.status(401).json({
                message: "Invalid Google account details"
            })
        }

        let user = await userModel.findOne({
            $or: [{ googleId }, { email }]
        })

        if (!user) {
            const baseUsername = (name || email.split("@")[0])
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "")
                .slice(0, 24) || "googleuser"

            user = await userModel.create({
                username: `${baseUsername}_${googleId.slice(-6)}`,
                email,
                googleId,
                picture,
                authProvider: "google",
            })
        } else if (!user.googleId) {
            user.googleId = googleId
            user.picture = user.picture || picture
            user.authProvider = user.authProvider || "google"
            await user.save()
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" },
        )

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: process.env.NODE_ENV === "production",
        })

        res.status(200).json({
            message: "user logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                picture: user.picture
            }
        })
    } catch (error) {
        return res.status(401).json({
            message: "Google login failed"
        })
    }
}
async function githubLoginController(req, res) {
    if (!process.env.GITHUB_CLIENT_ID) {
        return res.status(500).json({
            message: "GitHub client id is not configured"
        })
    }

    const callbackUrl = process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback"
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: callbackUrl,
        scope: "user:email",
    })

    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
}
async function githubCallbackController(req, res) {
    try {
        const { code } = req.query

        if (!code) {
            return res.status(400).json({
                message: "GitHub code is required"
            })
        }

        if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
            return res.status(500).json({
                message: "GitHub OAuth is not configured"
            })
        }

        const callbackUrl = process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback"

        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: callbackUrl,
            }),
        })
        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token

        if (!accessToken) {
            return res.status(401).json({
                message: "GitHub login failed"
            })
        }

        const githubHeaders = {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
        }

        const userResponse = await fetch("https://api.github.com/user", {
            headers: githubHeaders,
        })

        if (!userResponse.ok) {
            return res.status(401).json({
                message: "GitHub user details could not be fetched"
            })
        }

        const githubUser = await userResponse.json()
        const emailResponse = await fetch("https://api.github.com/user/emails", {
            headers: githubHeaders,
        })

        if (!emailResponse.ok) {
            return res.status(401).json({
                message: "GitHub email could not be fetched"
            })
        }

        const emails = await emailResponse.json()
        const primaryEmail = Array.isArray(emails)
            ? emails.find(email => email.primary && email.verified)?.email
            : null

        if (!githubUser.id || !primaryEmail) {
            return res.status(401).json({
                message: "GitHub account must have a verified primary email"
            })
        }

        const githubId = String(githubUser.id)
        let user = await userModel.findOne({
            $or: [{ githubId }, { email: primaryEmail }]
        })

        if (!user) {
            user = await userModel.create({
                username: createProviderUsername(githubUser.login, primaryEmail, githubId, "githubuser"),
                email: primaryEmail,
                githubId,
                picture: githubUser.avatar_url,
                authProvider: "github",
            })
        } else if (!user.githubId) {
            user.githubId = githubId
            user.picture = user.picture || githubUser.avatar_url
            user.authProvider = user.authProvider || "github"
            await user.save()
        }

        const token = createAppToken(user)

        setAuthCookie(res, token)
        res.redirect(process.env.FRONTEND_URL || "http://localhost:5173")
    } catch (error) {
        return res.status(401).json({
            message: "GitHub login failed"
        })
    }
}


module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
    googleLoginController,
    githubLoginController,
    githubCallbackController,
}
