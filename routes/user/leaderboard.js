var express = require("express");
var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var user_helper = require("./../../helpers/user_helper");

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
        let users = await user_helper.get_all_user();
        if (users.status === 1) {
            var ranked_users = [];
            users.users.forEach((user,index) => {
                var obj = {
                    "name":user.name,
                    "username":user.username,
                    "image":user.image,
                    "rank":index+1
                };
                ranked_users.push(obj);
            });

            res.status(config.OK_STATUS).json({
                "status":1,
                "message":"User's rank found",
                "results":{
                    "total":ranked_users.length,
                    "users":ranked_users
                }
            });

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
        let users = await user_helper.get_all_user();
        if (users.status === 1) {
            var ranked_users = [];
            users.users.forEach((user,index) => {
                var obj = {
                    "name":user.name,
                    "username":user.username,
                    "image":user.image,
                    "rank":index+1
                };
                ranked_users.push(obj);
            });

            res.status(config.OK_STATUS).json({
                "status":1,
                "message":"User's rank found",
                "results":{
                    "total":ranked_users.length,
                    "users":ranked_users
                }
            });

        } else {
            res.status(config.BAD_REQUEST).json({ "status":0,"message":"Can't find data" });
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ "status":0,"message": errors });
    }
});

module.exports = router;