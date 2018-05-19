var express = require("express");
var router = express.Router();
var async = require("async");
var fs = require("fs");
var path = require("path");

var config = require("./../../config");
var logger = config.logger;

var user_helper = require("./../../helpers/user_helper");
var country_helper = require("./../../helpers/country_helper");

var interest_helper = require("./../../helpers/interest_helper");
var job_industry = require("./../../helpers/job_industry_helper");
var music_taste_helper = require("./../../helpers/music_taste_helper");
var language_helper = require("./../../helpers/language_helper");
var ethnicity_helper = require("./../../helpers/ethnicity_helper");
var education_helper = require("./../../helpers/education_helper");
var job_title_helper = require("./../../helpers/job_title_helper");

var FB = require('fb');

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
 * @api {get} /user/interest_details Get interest details
 * @apiName Get interest details
 * @apiGroup User
 *
 * @apiSuccess (Success 200) {Array} job_industry Array of Job_industry document
 * @apiSuccess (Success 200) {Array} interest Array of possible user interest
 * @apiSuccess (Success 200) {Array} music_taste Array of possible user's music_taste
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/interest_details", async (req, res) => {
    logger.trace("Get interest details API called");
    var job_industry_resp = await job_industry.get_all_job_industry();
    var interest_resp = await interest_helper.get_all_interest();
    var music_taste_resp = await music_taste_helper.get_all_music_taste();
    var country_resp = await country_helper.get_all_country();
    var language_resp = await language_helper.get_all_language();
    var job_title_resp = await job_title_helper.get_all_job_title();
    var education_resp = await education_helper.get_all_education();
    var ethnicity_resp = await ethnicity_helper.get_all_ethnicity();


    if (job_industry_resp.status === 1 && interest_resp.status === 1 && music_taste_resp.status === 1
        && country_resp.status === 1 && language_resp.status === 1 && job_title_resp.status === 1
        && education_resp.status === 1 && ethnicity_resp.status === 1) {
        logger.trace("got details successfully");
        res.status(config.OK_STATUS).json({
            "status": 1, "job_industry": job_industry_resp.job_industry, "interest": interest_resp.interest, "music_taste": music_taste_resp.music_taste,
            "country": country_resp.countries, "language": language_resp.language, "job_title": job_title_resp.job_title,
            "education": education_resp.education, "ethnicity": ethnicity_resp.ethnicity
        });
    } else {
        logger.error("Error occured while fetching details");
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Details not found" });
    }
})

/**
 * @api {put} /user Update user profile
 * @apiName Update user profile
 * @apiGroup User
 * 
 * @apiHeader {String}  Content-Type multipart/form-data
 * @apiHeader {String}  x-access-token  unique access-key
 * 
 * @apiParam {String} name User name
 * @apiParam {Array} user_interest User Interest
 * @apiParam {String} job_industry User Job Industry
 * @apiParam {String} music_taste User Music taste
 * @apiParam {File} [avatar] User avatar image
 * 
 * @apiSuccess (Success 200) {JSON} user User details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put('/', function (req, res) {
    user_id = req.userInfo.id;
    var obj = {};

    if (req.body.name && req.body.name != null) {
        obj.name = req.body.name;
    }
    if (req.body.job_industry && req.body.job_industry != null) {
        obj.job_industry = req.body.job_industry;
    }
    if (req.body.job_title && req.body.job_title != null) {
        obj.job_title = req.body.job_title;
    }
    if (req.body.music_taste && req.body.music_taste != null) {
        obj.music_taste = req.body.music_taste;
    }
    if (req.body.user_interest && req.body.user_interest != null) {
        obj.user_interest = JSON.parse(req.body.user_interest);
    }
    if (req.body.job_title && req.body.job_title != null) {
        obj.job_title = req.body.job_title;
    }
    if (req.body.username && req.body.username != null) {
        obj.username = req.body.username;
    }
    if (req.body.email && req.body.email != null) {
        obj.email = req.body.email;
    }
    if (req.body.short_bio && req.body.short_bio != null) {
        obj.short_bio = req.body.short_bio;
    }
    if (req.body.education && req.body.education != null) {
        obj.education = req.body.education;
    }
    if (req.body.language && req.body.language != null) {
        obj.language = req.body.language;
    }
    if (req.body.ethnicity && req.body.ethnicity != null) {
        obj.ethnicity = req.body.ethnicity;
    }
    if (req.body.relationship_status && req.body.relationship_status != null) {
        obj.relationship_status = req.body.relationship_status;
    }
    if (req.body.state && req.body.state != null) {
        obj.state = req.body.state;
    }
    if (req.body.suburb && req.body.suburb != null) {
        obj.suburb = req.body.suburb;
    }
    if (req.body.gender && req.body.gender != null) {
        obj.gender = req.body.gender;
    }
    if (req.body.date_of_birth && req.body.date_of_birth != null) {
        obj.date_of_birth = req.body.date_of_birth;
    }
    if (req.body.sexual_orientation && req.body.sexual_orientation != null) {
        obj.sexual_orientation = req.body.sexual_orientation;
    }

    if (req.body.country && req.body.country != null) {
        obj.country = req.body.country;
    }
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
            res.status(config.INTERNAL_SERVER_ERROR).json({ "error": user_resp.error });
        } else {
            res.status(config.OK_STATUS).json({ "message": "Profile has been updated successfully" });
        }
    });

});

/**
 * Add/edit social media account of particular user
 * /user/social_media
 * Developed by "ar"
 */
router.post('/social_media', async (req, res) => {
    var schema = {
        "social_media_platform": {
            notEmpty: true,
            errorMessage: "social_media_platform is required"
        }
    };

    req.checkBody(schema);
    var errors = req.validationErrors();

    if (!errors) {
        var user_resp = await user_helper.get_user_by_id(req.userInfo.id);
        let user = user_resp.User;

        if (!user[req.body.social_media_platform]) {
            user[req.body.social_media_platform] = {};
        }

        if (req.body.id) {
            user[req.body.social_media_platform]['id'] = req.body.id;
        }
        if (req.body.username) {
            user[req.body.social_media_platform]['username'] = req.body.username;
        }
        if (req.body.access_token) {
            user[req.body.social_media_platform]['access_token'] = req.body.access_token;
        }
        if (req.body.refresh_token) {
            user[req.body.social_media_platform]['refresh_token'] = req.body.refresh_token;
        }
        if (req.body.profile_url) {
            user[req.body.social_media_platform]['profile_url'] = req.body.profile_url;
        }
        if (req.body.no_of_friends) {
            user[req.body.social_media_platform]['no_of_friends'] = req.body.no_of_friends;
        }
        if (req.body.enable != undefined) {
            user[req.body.social_media_platform]['enable'] = req.body.enable;
        }

        var user_resp = await user_helper.update_user_by_id(req.userInfo.id, user);
        if (user_resp.status === 0) {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error has occured while updating user information", "error": user_resp.error });
        } else {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Profile has been updated successfully" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": errors });
    }
});

module.exports = router;