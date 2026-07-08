const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    try {

        const token = req.cookies.token;

        if (!token) {

            return res.redirect("/teacher/login");

        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.teacher = decoded;

        next();

    } catch (error) {

        return res.redirect("/teacher/login");

    }

};