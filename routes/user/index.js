var express = require("express");
var router = express.Router();
var async = require("async");
var fs = require("fs");
var path = require("path");

var config = require("./../../config");
var logger = config.logger;

var user_helper = require("./../../helpers/user_helper");

/**
 * @api {get} /user Profile - Get 
 * @apiName get_profile_by_id - Get
 * @apiGroup User
 *
 * @apiHeader {String}  x-access-token unique access-key
 *
 * @apiSuccess (Success 200) {Array} Profile as per id
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/", async (req, res) => {
    user_id = req.userInfo.id;
    logger.trace("Get all Profile API called");
    var resp_data = await user_helper.get_user_by_id(user_id);
    if (resp_data.status == 0) {
        logger.error("Error occured while fetching Profile = ", resp_data);
        res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
        logger.trace("Profile got successfully = ", resp_data);
        res.status(config.OK_STATUS).json(resp_data);
    }
});


/**
 * @api {put} /user Update user profile
 * @apiName Update user profile
 * @apiGroup User
 * 
 * @apiHeader {String}  Content-Type multipart/form-data
 * @apiHeader {String}  x-access-token  unique access-key
 * 
 * @apiParam {String} name User name
 * @apiParam {String} email User Email
 * @apiParam {String} user_interest User Interest
 * @apiParam {String} job_industry User Job Industry
 * @apiParam {String} music_taste User Music taste
 * @apiParam {File} [avatar] User avatar image
 * 
 * @apiSuccess (Success 200) {JSON} user User details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put('/', function (req, res) {
    user_id = req.userInfo.id;
    var schema = {
        "name": {
            notEmpty: true,
            errorMessage: "Name is required"
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
            var obj = {
                "name": req.body.name,
                "email": req.body.email,
                "user_interest": req.body.user_interest,
                "job_industry": req.body.job_industry,
                "music_taste": req.body.music_taste,
            };

            async.waterfall([
                function (callback) {
                    if (req.files && req.files['avatar']) {
                        logger.trace("Uploading avatar image");
                        var file = req.files['avatar'];
                        var dir = "./uploads/users";
                        var mimetype = ['image/png', 'image/jpeg', 'image/jpg'];
    
                        if (mimetype.indexOf(file.mimetype) !== -1) {
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir);
                            }
                            //var extention = path.extname(file.name);
                            var extension = '.jpg';
                            var filename = "user_" + new Date().getTime() + (Math.floor(Math.random() * 90000) + 10000) + extension;
                            file.mv(dir + '/' + filename, async (err) => {
                                if (err) {
                                    logger.trace("There was an issue in uploading avatar image");
                                    callback({ "status": config.MEDIA_ERROR_STATUS, "resp": { "status": 0, "message": "There was an issue in uploading avatar image" } });
                                } else {
                                    logger.trace("Avatar image has uploaded for user");
                                    callback(null, filename);
                                }
                            });
                        } else {
                            callback({ "status": config.MEDIA_ERROR_STATUS, "resp": { "status": 0, "message": "Invalid image format" } });
                        }
                    } else {
                        callback(null, null);
                    }
                }
            ], async (err, filename) => {
                if (err) {
                    res.status(err.status).json(err.resp);
                } else {
                    if (filename) {
                        obj.image = await filename;
                    }
                }
                var user_resp = await user_helper.update_user_by_id(req.userInfo.id, obj);
                if (user_resp.status === 0) {
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