var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");

var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var user_helper = require("./../../helpers/user_helper");


/**
 * @api {put} /user/profile Update profile
 * @apiName Update profile
 * @apiGroup User
 * 
 * @apiHeader {String}  Content-Type application/json
 * @apiHeader {String}  x-access-token  unique access-key
 * 
 * @apiParam {String} id User Id
 * @apiParam {String} name User name
 * @apiParam {String} username User username
 * @apiParam {String} email User Email
 * @apiParam {String} user_interest User Interest
 * * @apiParam {String} job_industry User Job Industry
 * * @apiParam {String} music_taste User Music taste
 * 
 * @apiSuccess (Success 200) {JSON} profile User details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put('/', function (req, res) {
    user_id = req.userInfo.id;
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

    };

    req.checkBody(schema);
    req.getValidationResult().then(function (result) {

        if (result.isEmpty()) {

            console.log("body = ", req.body);
            var obj = {
                "name": req.body.name,
                "username": req.body.username,
                "email": req.body.email,
                "user_interest": req.body.user_interest,
                "job_industry": req.body.job_industry,
                "music_taste": req.body.music_taste,
            };
            if (req.body.is_active && req.body.is_active != null) {
                obj.is_active = req.body.is_active;
            }

            console.log("obj = ", obj);
            var profile = profile_helper.update_by_id(user_id, obj);

            if (profile.status == 0) {
                res.status(config.INTERNAL_SERVER_ERROR).json({ "error": resp.err });
            } else {
                res.status(config.OK_STATUS).json({ "message": "Profile has been updated successfully" });
            }

        } else {
            var result = {
                message: "Validation Error",
                error: result.array()
            };
            res.status(config.VALIDATION_FAILURE_STATUS).json(result);
        }
    });
});




/**
* @api {post} /user/profile/create_profile Create Profile
* @apiName Profile - Add
* @apiGroup User

* @apiHeader {String}  Content-Type application/json
* @apiHeader {String}  x-access-token  unique access-key
* 
* @apiParam {String} name Name of profile
* @apiParam {String} username Username of profile
*  @apiParam {String} email Email of profile
*  @apiParam {String} job_industry Job Industry of profile
*  @apiParam {String} music_taste Music Taste of profile
*  @apiParam {String} interest Interest of profile

* @apiSuccess (Success 200) {JSON}profile details
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.post("/create_profile", async (req, res) => {
    user_id = req.userInfo.id;
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
        },
    };
    req.checkBody(schema);
    var errors = req.validationErrors();

    if (!errors) {
        var obj = {
            "name": req.body.name,
            "username": req.body.username,
            "email": req.body.email,
            "user_interest": req.body.user_interest,
            "job_industry": req.body.job_industry,
            "music_taste": req.body.music_taste
        };
        console.log(obj);
        let user_data = await user_helper.insert_user(obj);
        if (user_data.status === 0) {
            logger.error("Error while updating User data = ", user_data);
            return res.status(config.BAD_REQUEST).json({ user_data });
        } else {
            return res.status(config.OK_STATUS).json(user_data);
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }

});

module.exports = router;