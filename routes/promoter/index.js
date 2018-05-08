var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");
var moment = require('moment');
var router = express.Router();
var bcrypt = require('bcrypt');

var config = require('./../../config');
var promoter_helper = require('./../../helpers/promoter_helper');
var setting_helper = require('./../../helpers/setting_helper');
var job_industry_helper = require('./../../helpers/job_industry_helper');
var interest_helper = require('./../../helpers/interest_helper');
var music_taste_helper = require('./../../helpers/music_taste_helper');
var language_helper = require('./../../helpers/language_helper');
var education_helper = require('./../../helpers/education_helper');
var job_title_helper = require('./../../helpers/job_title_helper');
var ethnicity_helper = require('./../../helpers/ethnicity_helper');
var campaign_helper = require('./../../helpers/campaign_helper');
var global_helper = require('./../../helpers/global_helper');

var logger = config.logger;
const saltRounds = 10;

/** 
 * @api {post} /promoter/update_profile Update promoter profile
 * @apiName Update promoter profile
 * @apiGroup Promoter
 * 
 * @apiDescription  Update promoter info
 * 
 * @apiHeader {String}  Content-Type multipart/form-data
 * @apiHeader {String}  x-access-token promoter's unique access-key
 * 
 * @apiParam {String} [name] Full name of promoter
 * @apiParam {String} [company] Company name of the company
 * @apiParam {String} [country] Country of the brand
 * @apiParam {String} industry_category Industry category id
 * @apiParam {String} industry_description Industry description
 * @apiParam {File} [avatar] Industry avatar/logo
 * 
 * @apiSuccess (Success 200) {String} message Success message
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/update_profile', async (req, res) => {
    var schema = {
        'industry_category': {
            notEmpty: true,
            errorMessage: "Industry category is required"
        },
        'industry_description': {
            notEmpty: true,
            errorMessage: "Description is required"
        }
    };
    req.checkBody(schema);
    const errors = req.validationErrors();
    if (!errors) {
        var promoter_obj = {
            "industry_category": req.body.industry_category,
            "industry_description": req.body.industry_description,
            "industry_fill": true
        }

        if (req.body.name) { promoter_obj.full_name = req.body.name; }
        if (req.body.company) { promoter_obj.company = req.body.company; }
        if (req.body.country) { promoter_obj.country = req.body.country; }

        async.waterfall([
            function (callback) {
                if (req.files && req.files['avatar']) {
                    logger.trace("Uploading avatar image");
                    var file = req.files['avatar'];
                    var dir = "./uploads/promoter";
                    var mimetype = ['image/png', 'image/jpeg', 'image/jpg'];

                    if (mimetype.indexOf(file.mimetype) !== -1) {
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir);
                        }
                        //var extention = path.extname(file.name);
                        var extension = '.jpg';
                        var filename = "promoter_logo_" + new Date().getTime() + (Math.floor(Math.random() * 90000) + 10000) + extension;
                        file.mv(dir + '/' + filename, async (err) => {
                            if (err) {
                                logger.trace("There was an issue in uploading avatar image");
                                callback({ "status": config.MEDIA_ERROR_STATUS, "resp": { "status": 0, "message": "There was an issue in uploading avatar image" } });
                            } else {
                                logger.trace("Avatar image has uploaded for promoter");
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
                    promoter_obj.avatar = await filename;
                }

                let promoter_resp = await promoter_helper.update_promoter_by_id(req.userInfo.id, promoter_obj);
                if (promoter_resp.status === 0) {
                    res.status(config.INTERNAL_SERVER_ERROR).json({ "status": "0", "message": "Something went wrong while updating promoter profile", "error": promoter_resp.error });
                } else if (promoter_resp.status === 2) {
                    res.status(config.BAD_REQUEST).json({ "status": "0", "message": "Error in updation of promoter profile" });
                } else {
                    res.status(config.OK_STATUS).json({ "status": 1, "message": "Promoter profile has been updated" });
                }
            }
        });
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/** 
 * @api {get} /promoter/setting/:key Get settings value
 * @apiName Get settings value
 * @apiGroup Promoter
 * 
 * @apiDescription  Get settings value by key
 * 
 * @apiHeader {String}  x-access-token promoter's unique access-key
 * 
 * @apiSuccess (Success 200) {String} value Appropriate value for given key
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/setting/:key', async (req, res) => {
    var settings = await setting_helper.get_setting_by_key(req.params.key);
    if (settings.status === 1) {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Setting value found", "value": settings.setting.value });
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Setting not found" });
    }
});

/** 
 * @api {get} /promoter/filter_preference Get preference value
 * @apiName Get preference value
 * @apiGroup Promoter
 * 
 * @apiDescription  Get preference value by key
 * 
 * @apiHeader {String}  x-access-token promoter's unique access-key
 * 
 * @apiSuccess (Success 200) {Array} job_industry All job industry
 * @apiSuccess (Success 200) {Array} interest All user interest
 * @apiSuccess (Success 200) {Array} music_taste All Music taste
 * @apiSuccess (Success 200) {Array} language All language
 * @apiSuccess (Success 200) {Array} education All Education
 * @apiSuccess (Success 200) {Array} job_title All Job title
 * @apiSuccess (Success 200) {Array} ethnicity All Ethnicity
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/filter_preference', async (req, res) => {
    logger.trace("Get filter_preference API called");
    var job_industry_resp = await job_industry_helper.get_all_job_industry();
    var interest_resp = await interest_helper.get_all_interest();
    var music_taste_resp = await music_taste_helper.get_all_music_taste();
    var language_resp = await language_helper.get_all_language();
    var education_resp = await education_helper.get_all_education();
    var job_title_resp = await job_title_helper.get_all_job_title();
    var ethnicity_resp = await ethnicity_helper.get_all_ethnicity();

    if (job_industry_resp.status === 1 && interest_resp.status === 1 && music_taste_resp.status === 1) {
        logger.trace("got details successfully");
        res.status(config.OK_STATUS).json({ "status": 1, "job_industry": job_industry_resp.job_industry, "interest": interest_resp.interest, "music_taste": music_taste_resp.music_taste, "language": language_resp.language, "education": education_resp.education, "job_title": job_title_resp.job_title, "ethnicity": ethnicity_resp.ethnicity });
    } else {
        logger.error("Error occured while fetching Job Industry = ", resp_data);
        res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    }
});

/**
 * Get analytics statistics
 * /promoter/get_analytics
 * Changed by "ar"
 */
router.post("/get_analytics", async (req, res) => {
    if (!req.body.filter) {
        req.body.filter = [];
    }
    let resp = [];
    let keys = {
        "fb_friends": "user.facebook.no_of_friends",
        "insta_followers": "user.instagram.no_of_followers",
        "twitter_followers": "user.twitter.no_of_followers",
        "pinterest_followers": "user.pinterest.no_of_followers",
        "linkedin_connection": "user.linkedin.no_of_connections",
        "year_in_industry": "user.experience",
        "age": "user.dob",

        "name": "user.name",
        "gender": "user.gender",
        "location": "user.location",
        "job_industry": "user.job_industry",
        "education": "user.education",
        "language": "user.language",
        "ethnicity": "user.ethnicity",
        "interested_in": "user.interested_in",
        "relationship_status": "user.relationship_status",
        "music_taste": "user.music_taste"
    };

    async.each(req.body.filter, function (filter, loop_callback) {

        async.waterfall([
            function (callback) {
                let match_filter = {};
                if (filter) {
                    filter.forEach(filter_criteria => {
                        if (filter_criteria.type === "exact") {
                            match_filter[filter_criteria.field] = filter_criteria.value;
                        } else if (filter_criteria.type === "between") {
                            if (filter_criteria.field === "age") {
                                // Age is derived attribute and need to calculate based on date of birth
                                match_filter[filter_criteria.field] = {
                                    "$lte": moment().subtract(filter_criteria.min_value, "years").toDate(),
                                    "$gte": moment().subtract(filter_criteria.max_value, "years").toDate()
                                };
                            } else {
                                match_filter[filter_criteria.field] = { "$lte": filter_criteria.max_value, "$gte": filter_criteria.min_value };
                            }
                        } else if (filter_criteria.type === "like") {
                            let regex = new RegExp(filter_criteria.value);
                            match_filter[filter_criteria.field] = { "$regex": regex, "$options": "i" };
                        } else if (filter_criteria.type === "id") {
                            match_filter[filter_criteria.field] = { "$eq": new ObjectId(filter_criteria.value) };
                        }
                    });
                    callback(null, match_filter);
                } else {
                    callback(null, {});
                }
            },
            async (match_filter, callback) => {
                match_filter = await global_helper.rename_keys(match_filter, keys);
                let resp_data = await campaign_helper.get_campaign_analysis_by_promoter(req.userInfo.id, match_filter);
                resp.push(resp_data);
                callback(null);
            }
        ], async (err, resp) => {
            loop_callback();
        });
    }, async (err) => {
        if (err) {
            console.log("err = ", err);
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Please provide filter agrgument" });
        } else {
            res.status(config.OK_STATUS).json({ "status": 0, "message": "Analytics calculated", "result": resp });
        }
    });
});

/**
 * Get social analytics
 * /promoter/get_social_analytics
 * Developed by "ar"
 */
router.post("/get_social_analytics", async (req, res) => {
    var schema = {
        'start_date': {
            notEmpty: true,
            errorMessage: "start date is required"
        },
        'end_date': {
            notEmpty: true,
            errorMessage: "End date is required"
        }
    };

    req.checkBody(schema);
    const errors = req.validationErrors();
    if (!errors) {

        var startdate = moment(req.body.start_date, "YYYY-MM-DD").toDate();
        var enddate = moment(req.body.end_date, "YYYY-MM-DD").toDate();

        console.log("start = ", startdate);
        console.log("end = ", enddate);

        let custom_filter = {
            "start_date": {
                "$gte": moment(req.body.start_date, "YYYY-MM-DD").toDate(),
                "$lte": moment(req.body.end_date, "YYYY-MM-DD").toDate()
            }
        }

        if (req.body.social_media_platform) {
            custom_filter["social_media_platform"] = req.body.social_media_platform
        }

        let resp = [];
        let keys = {
            "fb_friends": "user.facebook.no_of_friends",
            "insta_followers": "user.instagram.no_of_followers",
            "twitter_followers": "user.twitter.no_of_followers",
            "pinterest_followers": "user.pinterest.no_of_followers",
            "linkedin_connection": "user.linkedin.no_of_connections",
            "year_in_industry": "user.experience",
            "age": "user.dob",

            "name": "user.name",
            "gender": "user.gender",
            "location": "user.location",
            "job_industry": "user.job_industry",
            "education": "user.education",
            "language": "user.language",
            "ethnicity": "user.ethnicity",
            "interested_in": "user.interested_in",
            "relationship_status": "user.relationship_status",
            "music_taste": "user.music_taste"
        };

        async.each(req.body.filter, function (filter, loop_callback) {

            async.waterfall([
                function (callback) {
                    let match_filter = {};
                    if (filter) {
                        filter.forEach(filter_criteria => {
                            if (filter_criteria.type === "exact") {
                                match_filter[filter_criteria.field] = filter_criteria.value;
                            } else if (filter_criteria.type === "between") {
                                if (filter_criteria.field === "age") {
                                    // Age is derived attribute and need to calculate based on date of birth
                                    match_filter[filter_criteria.field] = {
                                        "$lte": moment().subtract(filter_criteria.min_value, "years").toDate(),
                                        "$gte": moment().subtract(filter_criteria.max_value, "years").toDate()
                                    };
                                } else {
                                    match_filter[filter_criteria.field] = { "$lte": filter_criteria.max_value, "$gte": filter_criteria.min_value };
                                }
                            } else if (filter_criteria.type === "like") {
                                let regex = new RegExp(filter_criteria.value);
                                match_filter[filter_criteria.field] = { "$regex": regex, "$options": "i" };
                            } else if (filter_criteria.type === "id") {
                                match_filter[filter_criteria.field] = { "$eq": new ObjectId(filter_criteria.value) };
                            }
                        });
                        callback(null, match_filter);
                    } else {
                        callback(null, {});
                    }
                },
                async (match_filter, callback) => {
                    match_filter = await global_helper.rename_keys(match_filter, keys);
                    let resp_data = await campaign_helper.get_campaign_social_analysis_by_promoter(req.userInfo.id, match_filter, custom_filter);
                    resp.push(resp_data);
                    callback(null);
                }
            ], async (err, resp) => {
                loop_callback();
            });
        }, async (err) => {
            if (err) {
                console.log("err = ", err);
                res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Please provide filter agrgument" });
            } else {
                res.status(config.OK_STATUS).json({ "status": 0, "message": "Social analytics calculated", "result": resp });
            }
        });

    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * @api {post} /promoter/change_password Change password
 * @apiName Change password
 * @apiGroup Promoter
 * 
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {String} old_password Old password of user
 * @apiParam {String} new_password New password of user
 * 
 * @apiSuccess (Success 200) {String} message Success message (Password changed)
 * @apiError (Error 4xx) {String} message Validation or error message. (Any error or user not available)
 */
router.post('/change_password', async (req, res) => {
    logger.trace("API - Change password called");
    logger.debug("req.body = ", req.body);
    var schema = {
        'old_password': {
            notEmpty: true,
            errorMessage: "Old password is required"
        },
        'new_password': {
            notEmpty: true,
            errorMessage: "New password is required"
        }
    };
    req.checkBody(schema);
    const errors = req.validationErrors();
    if (!errors) {
        let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
        if (promoter_resp.status === 0) {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": promoter_resp.error });
        } else if (promoter_resp.status === 1) {
            if (bcrypt.compareSync(req.body.old_password, promoter_resp.promoter.password)) {
                let update_resp = await promoter_helper.update_promoter_by_id(req.userInfo.id, { "password": bcrypt.hashSync(req.body.new_password, saltRounds) });
                if (update_resp.status === 0) {
                    res.status(config.BAD_REQUEST).json({ "message": "Something went wrong while updating password.", "error": update_resp });
                } else if (update_resp.status === 2) {
                    res.status(config.BAD_REQUEST).json({ "message": "Old password and new password can't be same" });
                } else {
                    // Valid request. Password updated
                    res.status(config.OK_STATUS).json({ "message": "Password has been changed" });
                }
            } else {
                res.status(config.BAD_REQUEST).json({ "message": "Old password is incorrect" });
            }
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Promoter not exist" });
        }
    } else {
        // logger.error("Validation error ",errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

module.exports = router;