var config = require('../config');

module.exports = function (req, res, next) {
    if (req.decoded.role == "promoter" && req.baseUrl.match('/user')) {
        req.userInfo = req.decoded;
        next();
    } else if (req.decoded.role == "user" && req.baseUrl.match('/user')) {
        req.userInfo = req.decoded;
        next();
    } else if (req.decoded.role == "admin" && req.baseUrl.match('/admin')) {
        req.userInfo = req.decoded;
        next();
    } else if (req.decoded.role == "both") {
        req.userInfo = req.decoded;
        next();
    } else {
        console.log("User Info = ", req.decoded);
        return res.status(config.UNAUTHORIZED).json({
            "message": 'Unauthorized access'
        });
    }
}