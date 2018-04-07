var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");
var router = express.Router();

var config = require('./../../config');
var promoter_helper = require('./../../helpers/promoter_helper');
var setting_helper = require('./../../helpers/setting_helper');
var logger = config.logger;

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

        console.log("promoter = ",promoter_obj);

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
router.get('/setting/:key', async(req,res) => {
    var settings = await setting_helper.get_setting_by_key(req.params.key);
    if(settings.status === 1){
        res.status(config.OK_STATUS).json({"status":1,"message":"Setting value found","value":settings.setting.value});
    } else {
        res.status(config.BAD_REQUEST).json({"status":0,"message":"Setting not found"});
    }
});

module.exports = router;