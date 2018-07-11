var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");
var moment = require("moment");
var mongoose = require('mongoose');
var router = express.Router();

var config = require('./../../config');
var user_helper = require('./../../helpers/user_helper');
var global_helper = require("./../../helpers/global_helper");
var logger = config.logger;
var ObjectId = mongoose.Types.ObjectId;

/** 
 * @api {post} /promoter/user Get all user
 * @apiName Get all user
 * @apiGroup Promoter-User
 * 
 * @apiDescription  Get user based on given criteria
 * 
 * {"filter":[
 * 
 * {"field":"gender","type":"exact","value":"female"},
 * 
 * {"field":"age", "type":"between", "min_value":21,"max_value":25},
 * 
 * {"field":"location","type":"like","value":"surat"},
 * 
 * {"field":"fb_friends", "type":"between", "min_value":250,"max_value":500},
 * 
 * {"field":"insta_followers", "type":"between", "min_value":250,"max_value":500},
 * 
 * {"field":"twitter_followers", "type":"between", "min_value":250,"max_value":500},
 * 
 * {"field":"pinterest_followers", "type":"between", "min_value":250,"max_value":500},
 * 
 * {"field":"job_industry", "type":"id", "value":"5ac1a4147111f5d4332a4324"},
 * 
 * {"field":"year_in_industry", "type":"exact", "value":5},
 * 
 * {"field":"education", "type":"exact", "value":"greduate"},
 * 
 * {"field":"language", "type":"exact", "value":"english"},
 * 
 * {"field":"ethnicity", "type":"exact", "value":"indian"},
 * 
 * {"field":"interested_in", "type":"exact", "value":"male"},
 * 
 * {"field":"relationship_status", "type":"exact", "value":"Single"},
 * 
 * {"field":"music_taste", "type":"id", "value":"5ac1a4477111f5d4332a4351"}],
 * 
 * "sort":[{"field":"name", "value":1}, {"field":"email", "value":-1}] // -1 for descending, 1 for ascending
 * 
 * "page_size":2,
 * "page_no":1 }
 * 
 * @apiHeader {String}  x-access-token promoter's unique access-key
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {Array} [filter] Filter array contains field by which records need to filter
 * @apiParam {Object} [sort] Sort contains field by which records need to sort
 * @apiParam {Number} page_size Total number of record on page
 * @apiParam {Number} page_no Current page
 * 
 * @apiSuccess (Success 200) {JSON} results Users details with total user count
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/', async (req, res) => {
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
        var match_filter = {"status":true, "removed":false};
        var sort = {};
        if (req.body.filter) {
            req.body.filter.forEach(filter_criteria => {
                if (filter_criteria.type === "exact") {
                    if(filter_criteria.value != null && filter_criteria.value != ""){
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
                        match_filter[filter_criteria.field] = { "$gte": filter_criteria.min_value, "$lte": filter_criteria.max_value };
                    }
                } else if (filter_criteria.type === "like") {
                    if(filter_criteria.value != null && filter_criteria.value != ""){
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
            "fb_friends": "facebook.no_of_friends",
            "insta_followers": "instagram.no_of_friends",
            "twitter_followers": "twitter.no_of_friends",
            "pinterest_followers": "pinterest.no_of_friends",
            "linkedin_connection": "linkedin.no_of_friends",
            "year_in_industry": "experience",
            "age": "date_of_birth",
            "location":"suburb",
            "interested_in": "sexual_orientation"
        };
        match_filter = await global_helper.rename_keys(match_filter, keys);

        sort = await global_helper.rename_keys(sort, keys);
        var users = await user_helper.get_filtered_user(req.body.page_no, req.body.page_size, match_filter, sort);

        if (users.status === 1) {
            users.results.users = users.results.users.map((user) => {
                if (fs.existsSync('./uploads/users/' + user.image)) {
                    user.is_image = 1;
                    return user;
                } else {
                    user.is_image = 0;
                    user.image = "http://placehold.it/465x300/ececec/525f7f?text=No Image Found";
                    return user;
                }
            });
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Users found", "results": users.results });
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Users not found" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

module.exports = router;