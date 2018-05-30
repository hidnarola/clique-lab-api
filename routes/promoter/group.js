var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");
var moment = require("moment");
var mongoose = require('mongoose');
var router = express.Router();

var config = require('./../../config');
var group_helper = require('./../../helpers/group_helper');
var user_helper = require('./../../helpers/user_helper');
var global_helper = require("./../../helpers/global_helper");

var logger = config.logger;
var ObjectId = mongoose.Types.ObjectId;

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
                                callback({ "status": config.MEDIA_ERROR_STATUS, "resp": { "status": 0, "message": "There was an issue in uploading group image" } });
                            } else {
                                logger.trace("image has been uploaded for group. Image name = ", filename);
                                callback(null, filename);
                                // group_obj.image = await filename;
                            }
                        });
                    } else {
                        logger.error("Image format of group image is invalid");
                        callback({ "status": config.VALIDATION_FAILURE_STATUS, "resp": { "status": 0, "message": "Image format of group image is invalid" } });
                    }
                } else {
                    logger.info("Image not available to upload. Executing next instruction");
                    //res.send(config.MEDIA_ERROR_STATUS, "No image submitted");
                    callback(null, null);
                }
            }
        ], async (err, resp) => {
            if (err) {
                res.status(err.status).json(err.resp);
            } else {
                if (resp && resp != null) {
                    group_obj.image = await resp;
                }
                //End image upload
                let group_resp = await group_helper.insert_group(group_obj);
                if (group_resp.status === 0) {
                    logger.error("Error while inserting group = ", group_resp);
                    res.status(config.BAD_REQUEST).json({ group_resp });
                } else {
                    res.status(config.OK_STATUS).json(group_resp);
                }
            }
        });
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});


/** 
 * @api {get} /promoter/group Get all group
 * @apiName Get all group
 * @apiGroup Promoter-Group
 * 
 * @apiDescription  Get all group
 * 
 * @apiHeader {String}  x-access-token promoter's unique access-key
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiSuccess (Success 200) {JSON} results Groups details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/', async (req, res) => {
    var groups = await group_helper.get_all_group_of_promoter(req.userInfo.id);
    if (groups.status === 1) {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Groups found", "results": groups.results });
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Groups not found" });
    }
});

/** 
 * @api {post} /promoter/group/filter Get all group
 * @apiName Get all group
 * @apiGroup Promoter-Group
 * 
 * @apiDescription  Get group based on given criteria
 * 
 * {"filter":[
 * 
 * {"field":"name","type":"like","value":"surat"},
 * 
 * "sort":[{"field":"name", "value":1}] // -1 for descending, 1 for ascending
 * 
 * "page_size":6,
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
 * @apiSuccess (Success 200) {JSON} results Groups details with total group count
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/filter', async (req, res) => {
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
        var match_filter = { "promoter_id": { "$eq": new ObjectId(req.userInfo.id) } };
        var sort = {};
        if (req.body.filter) {
            req.body.filter.forEach(filter_criteria => {
                if (filter_criteria.type === "exact") {
                    match_filter[filter_criteria.field] = filter_criteria.value;
                } else if (filter_criteria.type === "between") {
                    match_filter[filter_criteria.field] = { "$gte": filter_criteria.min_value, "$lte": filter_criteria.max_value };
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
            sort["created_at"] = -1;
        }

        // let keys = {

        // };
        // match_filter = await global_helper.rename_keys(match_filter, keys);
        // sort = await global_helper.rename_keys(sort, keys);

        var groups = await group_helper.get_filtered_group(req.body.page_no, req.body.page_size, match_filter, sort);
        console.log("resp = ", groups);
        if (groups.status === 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Groups found", "results": groups.results });
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Groups not found" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

router.get('/list_for_user/:user_id', async (req, res) => {
    var group_resp = await group_helper.user_not_exist_group_for_promoter(req.params.user_id, req.userInfo.id);
    if (group_resp.status === 0) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while fetching group list", "error": group_resp.error });
    } else if (group_resp.status === 1) {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Groups found", "results": group_resp.groups });
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No group found for given user" });
    }
});

/**
 * 
 */
router.post('/:group_id/add_user/:user_id', async (req, res) => {
    var group_resp = await group_helper.insert_group_user({ "group_id": req.params.group_id, "user_id": req.params.user_id });
    if (group_resp.status === 0) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while adding user into group", "error": group_resp.error });
    } else {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "User has been added into group" });
    }
});

/**
 * /promoter/group/:group_id/members
 */
router.post('/:group_id/members', async (req, res) => {
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
                        match_filter[filter_criteria.field] = { "$lte": filter_criteria.min_value, "$gte": filter_criteria.max_value };
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
            "fb_friends": "members.facebook.no_of_friends",
            "insta_followers": "members.instagram.no_of_friends",
            "twitter_followers": "members.twitter.no_of_friends",
            "pinterest_followers": "members.pinterest.no_of_friends",
            "linkedin_connection": "members.linkedin.no_of_friends",
            "year_in_industry": "members.experience",
            "age": "members.date_of_birth",

            "name": "members.name",
            "gender": "members.gender",
            "location": "members.suburb",
            "job_industry": "members.job_industry",
            "education": "members.education",
            "language": "members.language",
            "ethnicity": "members.ethnicity",
            "interested_in": "members.interested_in",
            "relationship_status": "members.relationship_status",
            "music_taste": "members.music_taste"
        };
        match_filter = await global_helper.rename_keys(match_filter, keys);

        sort = await global_helper.rename_keys(sort, keys);
        var members = await group_helper.get_members_of_group(req.params.group_id, req.body.page_no, req.body.page_size, match_filter, sort);

        if (members.status === 1) {
            members.results.users = members.results.users.map((user) => {
                if (fs.existsSync('./uploads/users/' + user.image)) {
                    user.is_image = 1;
                    return user;
                } else {
                    user.is_image = 0;
                    user.image = "http://placehold.it/465x300/ececec/525f7f?text=No Image Found";
                    return user;
                }
            });
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Members found", "results": members.results });
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Members not found" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * Save result as a group for everyday user
 * /promoter/group/:group_id/add_filter_result_to_group
 * Developed by "ar"
 */
router.post('/:group_id/add_filter_result_to_group', async (req, res) => {
    var match_filter = {};
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
                    match_filter[filter_criteria.field] = { "$lte": filter_criteria.min_value, "$gte": filter_criteria.max_value };
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

    let keys = {
        "fb_friends": "facebook.no_of_friends",
        "insta_followers": "instagram.no_of_friends",
        "twitter_followers": "twitter.no_of_friends",
        "pinterest_followers": "pinterest.no_of_friends",
        "linkedin_connection": "linkedin.no_of_friends",
        "year_in_industry": "experience",
        "age": "date_of_birth",
        "location":"suburb"
    };
    match_filter = await global_helper.rename_keys(match_filter, keys);

    var users = await user_helper.get_filtered_user(0, 0, match_filter, 0);

    if (users.status === 1 && users.results && users.results.users) {
        var user_group = [];

        for (let user of users.results.users) {
            await user_group.push({
                "group_id": req.params.group_id,
                "user_id": user._id
            });
        }

        let group_users_resp = await group_helper.insert_multiple_group_user(user_group);
        if (group_users_resp.status == 0) {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No user available to add" });
        } else {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "User has been added to given group" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No user available to add" });
    }
})

/**
 * Save result as a group for group member
 * /promoter/group/:new_group_id/:old_group_id/add_filter_result_to_group
 * Developed by "ar"
 */
router.post('/:new_group_id/:old_group_id/add_filter_result_to_group', async (req, res) => {
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

    var members = await group_helper.get_members_of_group(req.params.old_group_id, 0, 0, match_filter, 0);

    if (members.status === 1 && members.results && members.results.users) {
        var user_group = [];

        for (let user of members.results.users) {
            await user_group.push({
                "group_id": req.params.new_group_id,
                "user_id": user._id
            });
        }

        let group_users_resp = await group_helper.insert_multiple_group_user(user_group);
        if (group_users_resp.status == 0) {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No user available to add" });
        } else {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "User has been added to given group" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No user available to add" });
    }
});

module.exports = router;