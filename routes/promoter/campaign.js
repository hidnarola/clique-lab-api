var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");
var router = express.Router();

var config = require('./../../config');
// var setting_helper = require('./../../helpers/setting_helper');
var logger = config.logger;

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
 * @apiParam {String} [hash_tag] Hash tag for campaign
 * @apiParam {String} [at_tag] At tag for campaign
 * @apiParam {String} privacy Privacy for campaign i.e. public or invite
 * @apiParam {Array} media_format Privacy for campaign i.e. public or invite
 * @apiParam {Array} location Location of campaign
 * @apiParam {Number} price Price of campaign
 * @apiParam {string} currency Currency of given price
 * @apiParam {File} cover_image Cover image of campaign
 * @apiParam {Array of file} board_image Mood board images of campaign
 * 
 * @apiSuccess (Success 200) {String} message Success message
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/update_profile', async (req, res) => {
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
        var campaign_obj = {
            "name": req.body.name,
            "industry_description": req.body.industry_description
        }

        if (req.body.name) { promoter_obj.full_name = req.body.name; }
        if (req.body.company) { promoter_obj.company = req.body.company; }

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

module.exports = router;