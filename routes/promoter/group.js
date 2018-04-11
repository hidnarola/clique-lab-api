var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");
var mongoose = require('mongoose');
var router = express.Router();

var config = require('./../../config');
var group_helper = require('./../../helpers/group_helper');

var logger = config.logger;

/**
 * @api {post} /promoter/group Add group
 * @apiName  Add group
 * @apiGroup Promoter-Group
 *
 * @apiHeader {String}  Content-Type multipart/form-data
 * @apiHeader {String}  x-access-token Promoter's unique access-key
 * 
 * @apiParam {String} name Group name
 * @apiParam {file} [image] Group image
 *
 * @apiSuccess (Success 200) {JSON} group Group details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post("/", async (req, res) => {
    var schema = {
        "name": {
            notEmpty: true,
            errorMessage: "Group name is required"
        }
    };

    req.checkBody(schema);
    var errors = req.validationErrors();
    if (!errors) {
        var group_obj = {
            "name": req.body.name,
            "promoter_id": req.userInfo.id
        };

        async.waterfall([
            function (callback) {
                // image upload
                var filename;
                if (req.files && req.files['image']) {
                    var file = req.files['image'];
                    var dir = "./uploads/group";
                    var mimetype = ['image/png', 'image/jpeg', 'image/jpg'];

                    if (mimetype.indexOf(file.mimetype) != -1) {
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir);
                        }
                        extention = path.extname(file.name);
                        filename = "group_" + new Date().getTime() + (Math.floor(Math.random() * 90000)) + extention;
                        file.mv(dir + '/' + filename, async (err) => {
                            if (err) {
                                logger.error("There was an issue in uploading group image");
                                callback({"status":config.MEDIA_ERROR_STATUS,"resp":{"status":0,"message": "There was an issue in uploading group image"}});
                            } else {
                                logger.trace("image has been uploaded for group. Image name = ", filename);
                                callback(null,filename);
                                // group_obj.image = await filename;
                            }
                        });
                    } else {
                        logger.error("Image format of group image is invalid");
                        res.send({ "status": config.VALIDATION_FAILURE_STATUS, "err": "Image format of group image is invalid" });
                    }
                } else {
                    logger.info("Image not available to upload. Executing next instruction");
                    //res.send(config.MEDIA_ERROR_STATUS, "No image submitted");
                    callback(null,null);
                }
            }
        ], async (err, resp) => {

        });

        //End image upload

        let group_resp = await group_helper.insert_group(group_obj);
        if (group_resp.status === 0) {
            logger.error("Error while inserting group = ", group_resp);
            res.status(config.BAD_REQUEST).json({ group_resp });
        } else {
            res.status(config.OK_STATUS).json(group_resp);
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

module.exports = router;