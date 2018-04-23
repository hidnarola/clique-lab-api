var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");
var moment = require("moment");
var mongoose = require('mongoose');
var router = express.Router();

var config = require('./../../config');
var campaign_helper = require('./../../helpers/campaign_helper');
var cart_helper = require('./../../helpers/cart_helper');
var user_helper = require('./../../helpers/user_helper');
var group_helper = require('./../../helpers/group_helper');
var global_helper = require("./../../helpers/global_helper");

var logger = config.logger;
var ObjectId = mongoose.Types.ObjectId;

/** 
 * @api {post} /promoter/campaign Add new campaign
 * @apiName Add new campaign
 * @apiGroup Promoter-Campaign
 * 
 * @apiDescription  Add new campaign
 * 
 * @apiHeader {String}  Content-Type multipart/form-data
 * @apiHeader {String}  x-access-token promoter's unique access-key
 * 
 * @apiParam {String} name Name of campaign
 * @apiParam {String} start_date Campaign start date
 * @apiParam {String} end_date Camoaign end date
 * @apiParam {String} call_to_action Call to action
 * @apiParam {String} [discount_code] _id of discount code
 * @apiParam {String} [description] Description
 * @apiParam {Array} social_media_platform Social media platform
 * @apiParam {Array} [hash_tag] Hash tag for campaign
 * @apiParam {Array} [at_tag] At tag for campaign
 * @apiParam {String} privacy Privacy for campaign i.e. public or invite
 * @apiParam {Array} media_format Privacy for campaign i.e. public or invite
 * @apiParam {String} location Location of campaign
 * @apiParam {Number} price Price of campaign
 * @apiParam {string} currency Currency of given price
 * @apiParam {File} cover_image Cover image of campaign
 * @apiParam {Array_of_file} board_image Mood board images of campaign
 * 
 * @apiSuccess (Success 200) {String} message Success message
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/', async (req, res) => {
    console.log("Campaign insert called");
    var schema = {
        'name': {
            notEmpty: true,
            errorMessage: "Campaign name is required"
        },
        'start_date': {
            notEmpty: true,
            errorMessage: "Start date of campaign is required"
        },
        'end_date': {
            notEmpty: true,
            errorMessage: "End date of campaign is required"
        },
        'call_to_action': {
            notEmpty: true,
            errorMessage: "Call to action is required"
        },
        'social_media_platform': {
            notEmpty: true,
            errorMessage: "Social media platform is required"
        },
        'privacy': {
            notEmpty: true,
            errorMessage: "Privacy is required"
        },
        'media_format': {
            notEmpty: true,
            errorMessage: "Media format is required"
        },
        'location': {
            notEmpty: true,
            errorMessage: "Location is required"
        },
        'price': {
            notEmpty: true,
            errorMessage: "Price is required"
        },
        'currency': {
            notEmpty: true,
            errorMessage: "Currency is required"
        }
    };
    req.checkBody(schema);
    const errors = req.validationErrors();
    if (!errors) {

        // Check cover and board image
        if (req.files && req.files['cover_image'] && req.files['board_image']) {
            var campaign_obj = {
                "name": req.body.name,
                "start_date": req.body.start_date,
                "end_date": req.body.end_date,
                "call_to_action": req.body.call_to_action,
                "social_media_platform": req.body.social_media_platform,
                "privacy": req.body.privacy,
                "media_format": req.body.media_format,
                "location": req.body.location,
                "price": req.body.price,
                "currency": req.body.currency,
                "promoter_id": req.userInfo.id
            }

            if (req.body.discount_code) { campaign_obj.discount_code = req.body.discount_code; }
            if (req.body.description) { campaign_obj.description = req.body.description; }
            if (req.body.hash_tag) { campaign_obj.hash_tag = JSON.parse(req.body.hash_tag); }
            if (req.body.at_tag) { campaign_obj.at_tag = JSON.parse(req.body.at_tag); }

            async.parallel({
                "cover": function (callback) {
                    logger.trace("Uploading cover image for campaign");
                    var file = req.files['cover_image'];
                    var dir = "./uploads/campaign";
                    var mimetype = ['image/png', 'image/jpeg', 'image/jpg'];

                    if (mimetype.indexOf(file.mimetype) !== -1) {
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir);
                        }
                        //var extention = path.extname(file.name);
                        var extension = '.jpg';
                        var filename = "cover_" + new Date().getTime() + (Math.floor(Math.random() * 90000) + 10000) + extension;
                        file.mv(dir + '/' + filename, async (err) => {
                            if (err) {
                                logger.trace("There was an issue in uploading cover image");
                                callback({ "status": config.MEDIA_ERROR_STATUS, "resp": { "status": 0, "message": "There was an issue in uploading cover image" } });
                            } else {
                                logger.trace("Campaign cover image has been uploaded");
                                callback(null, filename);
                            }
                        });
                    } else {
                        callback({ "status": config.MEDIA_ERROR_STATUS, "resp": { "status": 0, "message": "Invalid image format for cover image" } });
                    }
                },
                "mood_board": function (callback) {
                    var file_path_array = [];
                    var files = [].concat(req.files.board_image);
                    var dir = "./uploads/campaign";
                    var mimetype = ["image/png", "image/jpeg", "image/jpg"];

                    async.eachSeries(files, function (file, loop_callback) {
                        var mimetype = ["image/png", "image/jpeg", "image/jpg"];
                        if (mimetype.indexOf(file.mimetype) != -1) {
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir);
                            }
                            extention = path.extname(file.name);
                            filename = "board_" + new Date().getTime() + (Math.floor(Math.random() * 90000) + 10000) + extention;
                            file.mv(dir + "/" + filename, function (err) {
                                if (err) {
                                    logger.error("There was an issue in uploading image");
                                    loop_callback({ status: config.MEDIA_ERROR_STATUS, resp: { "status": 0, "message": "There was an issue in uploading image" } });
                                } else {
                                    logger.trace("image has been uploaded. Image name = ", filename);
                                    file_path_array.push(filename);
                                    loop_callback();
                                }
                            });
                        } else {
                            logger.error("Image format is invalid");
                            loop_callback({ status: config.VALIDATION_FAILURE_STATUS, resp: { "status": 0, "message": "Image format is invalid" } });
                        }
                    }, function (err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, file_path_array);
                        }
                    });
                }
            }, async (err, filenames) => {
                if (err) {
                    res.status(err.status).json(err.resp);
                } else {
                    campaign_obj.cover_image = filenames.cover;
                    campaign_obj.mood_board_images = filenames.mood_board;

                    let campaign_resp = await campaign_helper.insert_campaign(campaign_obj);
                    if (campaign_resp.status === 0) {
                        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": "0", "message": "Something went wrong while inserting campaign", "error": campaign_resp.error });
                    } else if (campaign_resp.status === 2) {
                        res.status(config.BAD_REQUEST).json({ "status": "0", "message": "Error in updation of promoter profile" });
                    } else {
                        res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaign has been inserted" });
                    }
                }
            });
        } else {
            if (req.files) {
                res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Cover image and mood board image are required" });
            } else if (req.files['cover_image']) {
                res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Cover image is required" });
            } else {
                res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Mood board is required" });
            }
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

// Fetch campaign in which given user is not available
// /promoter/campaign/list_for_user/:user_id
// Developed by "ar"
router.get('/list_for_user/:user_id', async (req, res) => {
    var campaign_resp = await campaign_helper.user_not_exist_campaign_for_promoter(req.params.user_id, req.userInfo.id);
    if (campaign_resp.status === 0) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while fetching campaign list", "error": campaign_resp.error });
    } else if (campaign_resp.status === 1) {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaigns found", "results": campaign_resp.campaigns });
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No campaign found for given user" });
    }
});

/**
 * Add user to given campaign
 * /promoter/campaign/:campaign_id/add_user/:user_id
 * Developed by "ar"
 */
router.post('/:campaign_id/add_user/:user_id', async (req, res) => {
    var campaign_resp = await campaign_helper.insert_campaign_user({ "campaign_id": req.params.campaign_id, "user_id": req.params.user_id });
    if (campaign_resp.status === 0) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while adding user into campaign", "error": campaign_resp.error });
    } else {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "User has been added into campaign" });
    }
});

/**
 * Fetch active campaign for logged-in promoter
 * /promoter/campaign/active
 * Developed by "ar"
 */
router.post('/active', async (req, res) => {
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
    const errors = req.validationErrors();
    if (!errors) {
        var campaign_resp = await campaign_helper.get_active_campaign_by_promoter(req.userInfo.id, req.body.page_no, req.body.page_size);
        if (campaign_resp.status === 0) {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while fetching active campaign", "error": campaign_resp.error });
        } else if (campaign_resp.status === 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaigns found", "results": campaign_resp.campaigns });
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No campaign found for given promoter" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * Fetch future campaign for logged-in promoter
 * /promoter/campaign/future
 * Developed by "ar"
 */
router.post('/future', async (req, res) => {
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
    const errors = req.validationErrors();
    if (!errors) {
        var campaign_resp = await campaign_helper.get_future_campaign_by_promoter(req.userInfo.id, req.body.page_no, req.body.page_size);
        if (campaign_resp.status === 0) {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while fetching active campaign", "error": campaign_resp.error });
        } else if (campaign_resp.status === 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaigns found", "results": campaign_resp.campaigns });
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No campaign found for given promoter" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * Fetch past campaign for logged-in promoter
 * /promoter/campaign/past
 * Developed by "ar"
 */
router.post('/past', async (req, res) => {
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
    const errors = req.validationErrors();
    if (!errors) {
        var campaign_resp = await campaign_helper.get_past_campaign_by_promoter(req.userInfo.id, req.body.page_no, req.body.page_size);
        if (campaign_resp.status === 0) {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while fetching past campaign", "error": campaign_resp.error });
        } else if (campaign_resp.status === 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaigns found", "results": campaign_resp.campaigns });
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No campaign found for given promoter" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * Save result as a campaign for everyday user
 * /promoter/campaign/:campaign_id/add_filter_result_to_campaign
 * Developed by "ar"
 */
router.post('/:campaign_id/add_filter_result_to_campaign', async (req, res) => {
    var match_filter = {};
    if (req.body.filter) {
        req.body.filter.forEach(filter_criteria => {
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
                    match_filter[filter_criteria.field] = { "$lte": filter_criteria.min_value, "$gte": filter_criteria.max_value };
                }
            } else if (filter_criteria.type === "like") {
                var regex = new RegExp(filter_criteria.value);
                match_filter[filter_criteria.field] = { "$regex": regex, "$options": "i" };
            } else if (filter_criteria.type === "id") {
                match_filter[filter_criteria.field] = { "$eq": new ObjectId(filter_criteria.value) };
            }
        });
    }

    let keys = {
        "fb_friends": "facebook.no_of_friends",
        "insta_followers": "instagram.no_of_followers",
        "twitter_followers": "twitter.no_of_followers",
        "pinterest_followers": "pinterest.no_of_followers",
        "linkedin_connection": "linkedin.no_of_connections",
        "year_in_industry": "experience",
        "age": "date_of_birth"
    };
    match_filter = await global_helper.rename_keys(match_filter, keys);

    var users = await user_helper.get_filtered_user(0, 0, match_filter, 0);

    if (users.status === 1 && users.results && users.results.users) {
        var user_campaign = [];

        for (let user of users.results.users) {
            await user_campaign.push({
                "campaign_id": req.params.campaign_id,
                "user_id": user._id
            });
        }

        let campaign_users_resp = await campaign_helper.insert_multiple_campaign_user(user_campaign);
        if (campaign_users_resp.status == 0) {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No user available to add" });
        } else {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "User has been added to given campaign" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No user available to add" });
    }
})

/**
 * Save result as a campaign for group member
 * /promoter/campaign/:campaign_id/:group_id/add_filter_result_to_campaign
 * Developed by "ar"
 */
router.post('/:campaign_id/:group_id/add_filter_result_to_campaign', async (req, res) => {
    var match_filter = {};
    if (req.body.filter) {
        req.body.filter.forEach(filter_criteria => {
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
                    match_filter[filter_criteria.field] = { "$lte": filter_criteria.min_value, "$gte": filter_criteria.max_value };
                }
            } else if (filter_criteria.type === "like") {
                var regex = new RegExp(filter_criteria.value);
                match_filter[filter_criteria.field] = { "$regex": regex, "$options": "i" };
            } else if (filter_criteria.type === "id") {
                match_filter[filter_criteria.field] = { "$eq": new ObjectId(filter_criteria.value) };
            }
        });
    }

    let keys = {
        "fb_friends": "members.facebook.no_of_friends",
        "insta_followers": "members.instagram.no_of_followers",
        "twitter_followers": "members.twitter.no_of_followers",
        "pinterest_followers": "members.pinterest.no_of_followers",
        "linkedin_connection": "members.linkedin.no_of_connections",
        "year_in_industry": "members.experience",
        "age": "members.date_of_birth",

        "gender": "members.gender",
        "location": "members.location",
        "job_industry": "members.job_industry",
        "education": "members.education",
        "language": "members.language",
        "ethnicity": "members.ethnicity",
        "interested_in": "members.interested_in",
        "relationship_status": "members.relationship_status",
        "music_taste": "members.music_taste"
    };
    match_filter = await global_helper.rename_keys(match_filter, keys);

    var members = await group_helper.get_members_of_group(req.params.group_id, 0, 0, match_filter, 0);

    if (members.status === 1 && members.results && members.results.members) {
        var user_campaign = [];

        for (let user of members.results.members) {
            await user_campaign.push({
                "campaign_id": req.params.campaign_id,
                "user_id": user._id
            });
        }

        let campaign_users_resp = await campaign_helper.insert_multiple_campaign_user(user_campaign);
        if (campaign_users_resp.status == 0) {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No user available to add" });
        } else {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "User has been added to given campaign" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No user available to add" });
    }
});

/**
 * Stop campaign by id
 * /promoter/campaign/stop/:campaign_id
 * Developed by "ar"
 */
router.post('/stop/:campaign_id', async (req, res) => {
    var obj = {
        "end_date": moment().toDate(),
        "is_stop_by_promoter": true
    };
    var campaign_resp = await campaign_helper.update_campaign_by_id(req.params.campaign_id, obj);
    if (campaign_resp.status === 0) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while stoping campaign", "error": campaign_resp.error });
    } else if (campaign_resp.status === 2) {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Can't stop campaign" });
    } else {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaign has been stopped" });
    }
});

/**
 * Purchase post
 * /promoter/campaign/add_to_cart/:campaign_id/:user_id
 * Developed by "ar"
 */
router.post('/add_to_cart/:campaign_id/:user_id', async (req, res) => {
    var cart = {
        "promoter_id": req.userInfo.id,
        "campaign_id": req.params.campaign_id
    };
    let cart_resp = await cart_helper.insert_cart_item(cart);

    if (cart_resp.status === 0) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while adding campaign into cart" });
    } else {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaign has been added in cart" });
    }
});

/**
 * Purchase filter campaign
 * /promoter/campaign/:campaign_id/add_filtered_user_to_cart
 * Developed by "ar"
 */
router.post('/:campaign_id/add_filtered_user_to_cart', async (req, res) => {
    var match_filter = {};
    if (req.body.filter) {
        req.body.filter.forEach(filter_criteria => {
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
                    match_filter[filter_criteria.field] = { "$lte": filter_criteria.min_value, "$gte": filter_criteria.max_value };
                }
            } else if (filter_criteria.type === "like") {
                var regex = new RegExp(filter_criteria.value);
                match_filter[filter_criteria.field] = { "$regex": regex, "$options": "i" };
            } else if (filter_criteria.type === "id") {
                match_filter[filter_criteria.field] = { "$eq": new ObjectId(filter_criteria.value) };
            }
        });
    }

    let keys = {
        "fb_friends": "campaign_user.facebook.no_of_friends",
        "insta_followers": "campaign_user.instagram.no_of_followers",
        "twitter_followers": "campaign_user.twitter.no_of_followers",
        "pinterest_followers": "campaign_user.pinterest.no_of_followers",
        "linkedin_connection": "campaign_user.linkedin.no_of_connections",
        "year_in_industry": "campaign_user.experience",
        "age": "campaign_user.date_of_birth",

        "gender": "campaign_user.gender",
        "location": "campaign_user.location",
        "job_industry": "campaign_user.job_industry",
        "education": "campaign_user.education",
        "language": "campaign_user.language",
        "ethnicity": "campaign_user.ethnicity",
        "interested_in": "campaign_user.interested_in",
        "relationship_status": "campaign_user.relationship_status",
        "music_taste": "campaign_user.music_taste"
    };

    match_filter = await global_helper.rename_keys(match_filter, keys);

    var campaign_user = await campaign_helper.get_campaign_users_by_campaignid(req.params.campaign_id, 0, 0, match_filter, 0);

    if (campaign_user.status === 1) {

        var user_campaign = [];

        for (let user of campaign_user.campaign.campaign_user) {
            await user_camapign.push({
                "campaign_id": req.params.campaign_id,
                "user_id": user.user_id
            });
        }

        let cart_users_resp = await cart_helper.insert_multiple_cart_item(user_campaign);
        if (cart_users_resp.status == 0) {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No user available to add" });
        } else {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaign has been added to cart" });
        }
    } else if (campaign_user.status === 2) {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Campaign not found" });
    } else {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured during fetching campaign details", error: campaign_user.error });
    }
});

/**
 * Delete campaign by id
 * /promoter/campaign/:campaign_id
 * Developed by "ar"
 */
router.delete('/:campaign_id', async (req, res) => {
    var campaign_resp = await campaign_helper.delete_campaign_by_id(req.params.campaign_id);
    if (campaign_resp.status === 0) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while deleting campaign", "error": campaign_resp.error });
    } else if (campaign_resp.status === 2) {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Can't delete campaign" });
    } else {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaign has been deleted" });
    }
});

/**
 * Get details of campaign by campaign_id
 * /promoter/campaign/:campaign_id
 * Developed by "ar"
 */
router.post('/:campaign_id', async (req, res) => {
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
    const errors = req.validationErrors();
    if (!errors) {
        var match_filter = {};
        var sort = {};
        if (req.body.filter) {
            req.body.filter.forEach(filter_criteria => {
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
                        match_filter[filter_criteria.field] = { "$lte": filter_criteria.min_value, "$gte": filter_criteria.max_value };
                    }
                } else if (filter_criteria.type === "like") {
                    var regex = new RegExp(filter_criteria.value);
                    match_filter[filter_criteria.field] = { "$regex": regex, "$options": "i" };
                } else if (filter_criteria.type === "id") {
                    match_filter[filter_criteria.field] = { "$eq": new ObjectId(filter_criteria.value) };
                }
            });
        }

        if (req.body.sort) {
            req.body.sort.forEach(sort_criteria => {
                sort[sort_criteria.field] = sort_criteria.value;
            });
        }

        if (Object.keys(sort).length === 0) {
            sort["_id"] = 1;
        }

        let keys = {
            "fb_friends": "campaign_user.facebook.no_of_friends",
            "insta_followers": "campaign_user.instagram.no_of_followers",
            "twitter_followers": "campaign_user.twitter.no_of_followers",
            "pinterest_followers": "campaign_user.pinterest.no_of_followers",
            "linkedin_connection": "campaign_user.linkedin.no_of_connections",
            "year_in_industry": "campaign_user.experience",
            "age": "campaign_user.date_of_birth",

            "gender": "campaign_user.gender",
            "location": "campaign_user.location",
            "job_industry": "campaign_user.job_industry",
            "education": "campaign_user.education",
            "language": "campaign_user.language",
            "ethnicity": "campaign_user.ethnicity",
            "interested_in": "campaign_user.interested_in",
            "relationship_status": "campaign_user.relationship_status",
            "music_taste": "campaign_user.music_taste"
        };

        match_filter = await global_helper.rename_keys(match_filter, keys);
        sort = await global_helper.rename_keys(sort, keys);

        var campaign_user = await campaign_helper.get_campaign_users_by_campaignid(req.params.campaign_id, req.body.page_no, req.body.page_size, match_filter, sort);

        if (campaign_user.status === 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaign details found", "campaign": campaign_user.campaign });
        } else if (campaign_user.status === 2) {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Campaign not found" });
        } else {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured during fetching campaign details", error: campaign_user.error });
        }

    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

module.exports = router;