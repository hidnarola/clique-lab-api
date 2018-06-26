var express = require("express");
var moment = require("moment");
var mongoose = require('mongoose');
var fs = require("fs");
var router = express.Router();

var config = require('./../../config');

var global_helper = require("./../../helpers/global_helper");
var cart_helper = require('./../../helpers/cart_helper');
var inspired_submission_helper = require('./../../helpers/inspired_submission_helper');

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
        } else {
            sort["created_at"] = -1;
        }

        let keys = {
            "fb_friends": "users.facebook.no_of_friends",
            "insta_followers": "users.instagram.no_of_friends",
            "twitter_followers": "users.twitter.no_of_friends",
            "pinterest_followers": "users.pinterest.no_of_friends",
            "linkedin_connection": "users.linkedin.no_of_friends",
            "year_in_industry": "users.experience",
            "age": "users.date_of_birth",

            "name":"users.name",
            "gender": "users.gender",
            "location": "users.suburb",
            "job_industry": "users.job_industry",
            "job_title": "users.job_title",
            "education": "users.education",
            "language": "users.language",
            "ethnicity": "users.ethnicity",
            "interested_in": "users.sexual_orientation",
            "relationship_status": "users.relationship_status",
            "music_taste": "users.music_taste"
        };
        match_filter = await global_helper.rename_keys(match_filter, keys);

        sort = await global_helper.rename_keys(sort, keys);
        var posts = await inspired_submission_helper.get_filtered_submission_for_promoter(req.userInfo.id, req.body.page_no, req.body.page_size, match_filter,sort);

        if (posts.status === 1) {

            posts.submissions.posts = posts.submissions.posts.map((post) => {
                if (fs.existsSync('./uploads/inspired_submission/' + post.image)) {
                    post.is_image = 1;
                    return post;
                } else {
                    post.is_image = 0;
                    post.image = "http://placehold.it/450x215/ececec/525f7f?text=No Image Found";
                    return post;
                }
            });

            res.status(config.OK_STATUS).json({ "status": 1, "message": "Post found", "results": posts.submissions });
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Post not found" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * add_to_cart purchase post
 * /promoter/inspired_submission/add_to_cart/:post_id/:user_id
 * Developed by "ar"
 */
router.post('/add_to_cart/:post_id', async (req, res) => {

    if((await cart_helper.promoter_applied_post_available(req.userInfo.id,req.params.post_id)) <= 0){
        var cart = {
            "promoter_id": req.userInfo.id,
            "inspired_post_id": req.params.post_id
        };
        let cart_resp = await cart_helper.insert_cart_item(cart);
    
        if (cart_resp.status === 0) {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": cart_resp.message });
        } else {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Post has been added in cart" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Post has already available in cart" });
    }
});

module.exports = router;