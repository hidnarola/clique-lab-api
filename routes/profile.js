var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");

var router = express.Router();

var config = require("./../config");
var logger = config.logger;

var profile = require("../helpers/profile_helper");



/**
 * @api {post} /profile Exercise Types Add
 * @apiName Exercise Type Add
 * @apiGroup Admin
 * 
 * @apiHeader {String}  Content-Type application/json
 * @apiHeader {String}  x-access-token  unique access-key
 * 
 * @apiParam {String} name Name of profile
 * @apiParam {String} description Description of profile
 * 
 * @apiSuccess (Success 200) {JSON}profile types details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/insert', async (req, res) => {
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
        var profile_obj = {
            "name": req.body.name,
            "username": req.body.username,
            "email": req.body.email,
            "user_interest": req.body.user_interest,
            "job_industry": req.body.job_industry,
            "music_taste": req.body.music_taste
           
        };

        let profile_data = await profile.insert_profile(profile_obj);
        if (profile_data.status === 0) {
            
            logger.error("Error while inserting Profile data = ", profile_data);
            res.status(config.BAD_REQUEST).json({ profile_data });
        } else {
            res.status(config.OK_STATUS).json(profile_data);
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});


module.exports = router;
