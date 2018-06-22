var express = require("express");
var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var user_helper = require("./../../helpers/user_helper");
var earning_helper = require("./../../helpers/earning_helper");

/**
 * Get leaderboard data
 */
router.post("/friends",async(req,res) => {
    var schema = {
        'page_size': {
            notEmpty: true,
            errorMessage: "Page size is required"
        },
        'page_no': {
            notEmpty: true,
            errorMessage: "Page number is required"
        }
    };
    req.checkBody(schema);
    var errors = req.validationErrors();

    if (!errors) {
        let users = await user_helper.find_fb_friends_ranking(req.userInfo.id,req.body.page_no, req.body.page_size);
        console.log("users ==> ",users);
        if (users.status === 1) {
            res.status(config.OK_STATUS).json(users);
        } else {
            res.status(config.BAD_REQUEST).json({ "status":0,"message":"Can't find data" });
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ "status":0,"message": errors });
    }
});

/**
 * Get leaderboard data
 */
router.post("/all",async(req,res) => {
    var schema = {
        'page_size': {
            notEmpty: true,
            errorMessage: "Page size is required"
        },
        'page_no': {
            notEmpty: true,
            errorMessage: "Page number is required"
        }
    };
    req.checkBody(schema);
    var errors = req.validationErrors();

    if (!errors) {
        let users = await earning_helper.get_earning_of_users(req.body.page_no, req.body.page_size);
        console.log("result ==> ",users);
        if (users.status === 1) {
            res.status(config.OK_STATUS).json(users);
        } else {
            res.status(config.BAD_REQUEST).json({ "status":0,"message":"Can't find data" });
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ "status":0,"message": errors });
    }
});

module.exports = router;