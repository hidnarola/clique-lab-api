var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");
var router = express.Router();

var config = require('./../../config');
var campaign_helper = require('./../../helpers/campaign_helper');
var logger = config.logger;

router.get('/',async (req,res) => {
    res.send("Done");
})

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
                "social_media_platform": JSON.parse(req.body.social_media_platform),
                "privacy": req.body.privacy,
                "media_format": JSON.parse(req.body.media_format),
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
                                    location = "uploads/exercise/" + filename;
                                    file_path_array.push(location);
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

module.exports = router;