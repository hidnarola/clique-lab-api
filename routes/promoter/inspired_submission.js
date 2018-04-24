var express = require("express");
var moment = require("moment");
var mongoose = require('mongoose');
var router = express.Router();

var config = require('./../../config');

var global_helper = require("./../../helpers/global_helper");

var logger = config.logger;
var ObjectId = mongoose.Types.ObjectId;

/**
 * Get all inspired submission with filtering and sorting
 * /promoter/inspired_submission
 * Developed by "ar"
 */
router.post('/',async (req,res) => {
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

        if(Object.keys(sort).length === 0){
            sort["_id"] = 1;
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

        sort = await global_helper.rename_keys(sort, keys);
        var users = await user_helper.get_filtered_user(req.body.page_no, req.body.page_size, match_filter,sort);

        console.log("users = ",users);
        if (users.status === 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Users found", "results": users.results });
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Users not found" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

module.exports = router;