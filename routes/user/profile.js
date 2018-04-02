var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");

var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var profile_helper = require("./../../helpers/profile_helper");

/**
 * @api {get} user/profile Profile - Get 
 * @apiName get_profile_by_id - Get
 *
 * @apiHeader {String}  x-access-token unique access-key
 *
 * @apiSuccess (Success 200) {Array} Profile as per id
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/", async (req, res) => {
    user_id = req.userInfo.id;
    logger.trace("Get all Profile API called");
    var resp_data = await profile_helper.get_profile_by_id(user_id);
    if (resp_data.status == 0) {
        logger.error("Error occured while fetching Profile = ", resp_data);
        res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
        logger.trace("Profile got successfully = ", resp_data);
        res.status(config.OK_STATUS).json(resp_data);
    }
});




/**
 * @api {put} /user/profile Update profile
 * @apiName Update faq
 * @apiGroup Admin
 * 
 * @apiHeader {String}  Content-Type application/json
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * 
 * @apiParam {String} id FAQ Id
 * @apiParam {String} question FAQ question
 * @apiParam {String} answer FAQ answer
 * @apiParam {String} category_id Category of FAQ
 * @apiParam {String} [is_active] Activation status for faq
 * 
 * @apiSuccess (Success 200) {JSON} driver Driver details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put('/', function (req, res) {
user_id=req.userInfo.id;
    var schema = {
        "name": {
            notEmpty: true,
            errorMessage: "Name is required"
        },
        "username": {
            notEmpty: true,
            errorMessage: "Username is required"
        },
        "email": {
            notEmpty: true,
            errorMessage: "Email is required"
        },
        "user_interest": {
            notEmpty: true,
            errorMessage: "User Interest is required"
        },

        "job_industry": {
            notEmpty: true,
            errorMessage: "Job Industry is required"
        },
        "music_taste": {
            notEmpty: true,
            errorMessage: "Music taste is required"
        }
        // ,
        // "facebook": {
        //     "token": { notEmpty: true },
        //     "no_of_friends": { notEmpty: true },
        // },
        // "instagram": {
        //     "token": { notEmpty: true },
        //     "no_of_followers": { notEmpty: true },
        // },
    };

    req.checkBody(schema);
    req.getValidationResult().then(function (result) {

        if (result.isEmpty()) {

            console.log("body = ",req.body);
            var obj = {
                "name": req.body.name,
                "username": req.body.username,
                "email": req.body.email,
                "user_interest": req.body.user_interest,
                "job_industry": req.body.job_industry,
                "music_taste": req.body.music_taste,
                "facebook": { "token": req.body.facebook.token, "no_of_friends": req.body.facebook.no_of_friends },
                "instagram": { "token": req.body.instagram.token, "no_of_followers": req.body.instagram.no_of_followers },
            };
            if (req.body.is_active && req.body.is_active != null) {
                obj.is_active = req.body.is_active;
            }
            profile_helper.update_by_id(user_id, obj, function (resp) {

                if (resp.status == 0) {
                    res.status(config.INTERNAL_SERVER_ERROR).json({ "error": resp.err });
                } else {
                    res.status(config.OK_STATUS).json({ "message": "Profile has been updated successfully" });
                }
            });
        } else {
            var result = {
                message: "Validation Error",
                error: result.array()
            };
            res.status(config.VALIDATION_FAILURE_STATUS).json(result);
        }
    });
});

module.exports = router;