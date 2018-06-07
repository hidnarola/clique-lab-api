var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");
var moment = require("moment");
var mongoose = require('mongoose');
var archiver = require('archiver');
var router = express.Router();
var sharp = require('sharp');

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

        console.log("req.files ==> ",req.files);
        console.log("board image ==> ",req.files['board_image']);
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

                                var thumbnail1 = await sharp(dir + '/' + filename)
                                    .resize(512, 384)
                                    .toFile(dir + '/512X384/' + filename);

                                var thumbnail1 = await sharp(dir + '/' + filename)
                                    .resize(100, 100)
                                    .toFile(dir + '/100X100/' + filename);

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
                            file.mv(dir + "/" + filename, async (err) => {
                                if (err) {
                                    logger.error("There was an issue in uploading image");
                                    loop_callback({ status: config.MEDIA_ERROR_STATUS, resp: { "status": 0, "message": "There was an issue in uploading image" } });
                                } else {

                                    var thumbnail1 = await sharp(dir + '/' + filename)
                                        .resize(180, 110)
                                        .toFile(dir + '/180X110/' + filename);

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

/**
 * get all campaign of promoter
 */
router.get('/', async (req, res) => {
    var campaigns = await campaign_helper.get_all_campaign_of_promoter(req.userInfo.id);
    if (campaigns.status === 1) {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaigns found", "results": campaigns.campaigns });
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Campaigns not found" });
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
        "insta_followers": "instagram.no_of_friends",
        "twitter_followers": "twitter.no_of_friends",
        "pinterest_followers": "pinterest.no_of_friends",
        "linkedin_connection": "linkedin.no_of_friends",
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
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "No user available to add" });
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
        "insta_followers": "members.instagram.no_of_friends",
        "twitter_followers": "members.twitter.no_of_friends",
        "pinterest_followers": "members.pinterest.no_of_friends",
        "linkedin_connection": "members.linkedin.no_of_friends",
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

    if (members.status === 1 && members.results && members.results.users) {
        var user_campaign = [];

        for (let user of members.results.users) {
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
 * Add to cart campaign
 * /promoter/campaign/add_to_cart/:campaign_id/:user_id
 * Developed by "ar"
 */
router.post('/add_to_cart/:campaign_id/:applied_post_id', async (req, res) => {
    var cart = {
        "promoter_id": req.userInfo.id,
        "campaign_id": req.params.campaign_id,
        "applied_post_id": req.params.applied_post_id
    };
    let cart_resp = await cart_helper.insert_cart_item(cart);

    if (cart_resp.status === 0) {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": cart_resp.message });
    } else {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaign has been added in cart" });
    }
});

/**
 * Purchase filter campaigns
 * /promoter/campaign/:campaign_id/add_filtered_applied_post_to_cart
 * Developed by "ar"
 */
router.post('/:campaign_id/add_filtered_applied_post_to_cart', async (req, res) => {
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
        "insta_followers": "campaign_user.instagram.no_of_friends",
        "twitter_followers": "campaign_user.twitter.no_of_friends",
        "pinterest_followers": "campaign_user.pinterest.no_of_friends",
        "linkedin_connection": "campaign_user.linkedin.no_of_friends",
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

    var campaign_post = await campaign_helper.get_applied_post_of_campaign(req.params.campaign_id, 0, 0, match_filter, 0);

    if (campaign_post.status === 1) {

        var applied_post = [];

        for (let post of campaign_post.campaign.users) {
            applied_post.push({
                "promoter_id": req.userInfo.id,
                "campaign_id": req.params.campaign_id,
                "applied_post_id": post.applied_post_id
            });
        }

        let cart_resp = await cart_helper.insert_multiple_cart_item(applied_post);
        if (cart_resp.status == 0) {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "No post available to add" });
        } else {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Post has been added to cart" });
        }
    } else if (campaign_post.status === 2) {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Campaign not found" });
    } else {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured during fetching campaign details", error: campaign_post.error });
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

router.post('/purchased', async (req, res) => {
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
            "fb_friends": "user.facebook.no_of_friends",
            "insta_followers": "user.instagram.no_of_friends",
            "twitter_followers": "user.twitter.no_of_friends",
            "pinterest_followers": "user.pinterest.no_of_friends",
            "linkedin_connection": "user.linkedin.no_of_friends",
            "year_in_industry": "user.experience",
            "age": "user.date_of_birth",

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

        match_filter = await global_helper.rename_keys(match_filter, keys);
        sort = await global_helper.rename_keys(sort, keys);

        let purchased_post = await campaign_helper.get_purchased_post_by_promoter(req.userInfo.id, req.body.page_no, req.body.page_size, match_filter, sort);

        if (purchased_post.status === 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Post found", "results": purchased_post.post });
        } else if (purchased_post.status === 2) {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No purchase post available" });
        } else {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured during fetching campaign details", error: purchased_post.error });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

router.post('/calendar', async (req, res) => {
    var schema = {
        'start_date': {
            notEmpty: true,
            errorMessage: "start date is required"
        },
        'end_date': {
            notEmpty: true,
            errorMessage: "End date is required"
        },
    };

    req.checkBody(schema);
    const errors = req.validationErrors();
    if (!errors) {

        var startdate = moment(req.body.start_date, "YYYY-MM-DD").toDate();
        var enddate = moment(req.body.end_date, "YYYY-MM-DD").toDate();

        console.log("start = ", startdate);
        console.log("end = ", enddate);

        let filter = {
            "start_date": {
                "$gte": moment(req.body.start_date, "YYYY-MM-DD").toDate(),
                "$lte": moment(req.body.end_date, "YYYY-MM-DD").toDate()
            }
        }

        if (req.body.social_media_platform) {
            filter["social_media_platform"] = req.body.social_media_platform;
        }

        var campaigns = await campaign_helper.get_promoters_by_social_media(req.userInfo.id, filter);

        if (campaigns.status === 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaign details found", "results": campaigns });
        } else if (campaigns.status === 2) {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Campaign not found" });
        } else {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured during fetching campaign details", error: campaigns.error });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * /promoter/campaign/get_demographics
 */
router.post('/get_demographics', async (req, res) => {

    var country = await campaign_helper.count_country_of_user(req.userInfo.id);
    var state = await campaign_helper.count_state_of_user(req.userInfo.id);
    var suburb = await campaign_helper.count_suburb_of_user(req.userInfo.id);
    var gender = await campaign_helper.count_gender_of_user(req.userInfo.id);
    var job_industry = await campaign_helper.count_job_industry_of_user(req.userInfo.id);
    var education = await campaign_helper.count_education_of_user(req.userInfo.id);
    var language = await campaign_helper.count_language_of_user(req.userInfo.id);
    var ethnicity = await campaign_helper.count_ethnicity_of_user(req.userInfo.id);
    var music_taste = await campaign_helper.count_music_taste_of_user(req.userInfo.id);
    var relationship_status = await campaign_helper.count_relationship_status_of_user(req.userInfo.id);
    var sexual_orientation = await campaign_helper.count_sexual_orientation_of_user(req.userInfo.id);

    var result = {
        "country": country.country[0], 
        "state": state.state[0], 
        "suburb": suburb.suburb[0], 
        "gender": gender.gender[0], 
        "job_industry": job_industry.job_industry[0], 
        "education": education.education[0], 
        "language": language.language[0], 
        "ethnicity": ethnicity.ethnicity[0], 
        "music_taste": music_taste.music_taste[0], 
        "relationship_status": relationship_status.relationship_status[0], 
        "sexual_orientation": sexual_orientation.sexual_orientation[0]
    }

    if (country.status === 1 && state.status === 1 && suburb.status === 1 && job_industry.status === 1 && education.status === 1 && language.status === 1 && ethnicity.status === 1 && music_taste.status === 1) {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaign details found", "results":result });
    } else if (campaigns.status === 2) {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Campaign not found" });
    } else {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured during fetching campaign details", error: campaigns.error });
    }

});

/**
 * Get applied post for campaign
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
                    if (filter_criteria.value != null && filter_criteria.value != "") {
                        match_filter[filter_criteria.field] = filter_criteria.value;
                    }
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
                    if (filter_criteria.value != null && filter_criteria.value != "") {
                        var regex = new RegExp(filter_criteria.value);
                        match_filter[filter_criteria.field] = { "$regex": regex, "$options": "i" };
                    }
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
            "fb_friends": "user.facebook.no_of_friends",
            "insta_followers": "user.instagram.no_of_friends",
            "twitter_followers": "user.twitter.no_of_friends",
            "pinterest_followers": "user.pinterest.no_of_friends",
            "linkedin_connection": "user.linkedin.no_of_friends",
            "year_in_industry": "user.experience",
            "age": "user.date_of_birth",

            "name": "user.name",
            "gender": "user.gender",
            "location": "user.suburb",
            "job_industry": "user.job_industry",
            "education": "user.education",
            "language": "user.language",
            "ethnicity": "user.ethnicity",
            "interested_in": "user.interested_in",
            "relationship_status": "user.relationship_status",
            "music_taste": "user.music_taste"
        };

        match_filter = await global_helper.rename_keys(match_filter, keys);
        sort = await global_helper.rename_keys(sort, keys);

        let campaign_post = await campaign_helper.get_applied_post_of_campaign(req.params.campaign_id, req.body.page_no, req.body.page_size, match_filter, sort);

        if (campaign_post.status === 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Applied post found", "results": campaign_post.campaign });
        } else if (campaign_post.status === 2) {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Applied post not found" });
        } else {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured during fetching applied post details", error: campaign_post.error });
        }

    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * Get details of campaign by campaign_id
 * /promoter/campaign/:campaign_id/campaign_users
 * Developed by "ar"
 * 
 * Not in used for now
 */
router.post('/:campaign_id/campaign_users', async (req, res) => {
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
            "insta_followers": "campaign_user.instagram.no_of_friends",
            "twitter_followers": "campaign_user.twitter.no_of_friends",
            "pinterest_followers": "campaign_user.pinterest.no_of_friends",
            "linkedin_connection": "campaign_user.linkedin.no_of_friends",
            "year_in_industry": "campaign_user.experience",
            "age": "campaign_user.date_of_birth",

            "name": "campaign_user.name",
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
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaign details found", "results": campaign_user.campaign });
        } else if (campaign_user.status === 2) {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Campaign not found" });
        } else {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured during fetching campaign details", error: campaign_user.error });
        }

    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * Download campaign images
 * /promoter/campaign/:campaign_id/download
 */
router.get('/:campaign_id/download', async (req, res) => {
    try {
        let campaign_resp = await campaign_helper.get_campaign_by_id(req.params.campaign_id);

        if (campaign_resp.status == 1) {

            var filename = new Date().getTime() + (Math.floor(Math.random() * 90000) + 10000) + '.zip';
            // create a file to stream archive data to.
            var output = fs.createWriteStream(__dirname + '/../../uploads/campaign/zip/' + filename);
            var archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });

            // pipe archive data to the file
            archive.pipe(output);

            archive.append(fs.createReadStream(__dirname + '/../../uploads/campaign/' + campaign_resp.Campaign.cover_image), { name: campaign_resp.Campaign.cover_image });

            campaign_resp.Campaign.mood_board_images.forEach(image => {
                archive.append(fs.createReadStream(__dirname + '/../../uploads/campaign/' + image), { name: image });
            });

            archive.append(fs.createReadStream(__dirname + '/../../uploads/campaign/' + campaign_resp.Campaign.cover_image), { name: campaign_resp.Campaign.cover_image });
            archive.finalize();

            res.status(200).json({ "status": 1, "message": "file is ready to download", "filename": filename });
        } else {
            res.status(200).json({ "status": 0, "message": "campaign not found" });
        }
    } catch (err) {
        console.log("error = ", err);
        res.send(err);
    }
});

module.exports = router;