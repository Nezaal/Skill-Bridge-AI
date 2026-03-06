const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.models")

async function authUser(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: "token not provided"
        })
    }

    const isTokenBlackListed = await tokenBlacklistModel.findOne({
        token
    })

    if (isTokenBlackListed) {
        return res.status(401).json({
            message: "token is invalid. please login  on again"
        })
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({
            message: "invalid token"
        })
    }


}
module.exports = { authUser }