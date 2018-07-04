var express = require("express");
var router = express.Router();
var moment = require('moment');

var user_helper = require('./../../helpers/user_helper');
var transaction_helper = require('./../../helpers/transaction_helper');

var config = require('./../../config');

/**
 * 
 */
router.post('/users', async (req, res) => {
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
        var match_filter = {  };
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
                        match_filter[filter_criteria.field] = { "$gte": filter_criteria.min_value, "$lte": filter_criteria.max_value };
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
            sort["created_at"] = -1;
        }

        let keys = {
            "location": "suburb"
        };

        // match_filter = await global_helper.rename_keys(match_filter, keys);
        // sort = await global_helper.rename_keys(sort, keys);

        var users = await user_helper.get_all_users_promoters(req.body.page_no, req.body.page_size, match_filter, sort);

        if (users.status === 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Users found", "results": users.users });
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Users not found" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

router.post('/transactions', async (req, res) => {
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
        var filter = {};
        if(req.body.search){
            var regex = new RegExp(req.body.search);
            filter["campaign_post.desription"] = { "$regex": regex, "$options": "i" };
        }

        let transaction_resp = await transaction_helper.get_all_transaction(filter,{"created_at":-1},req.body.page_no,req.body.page_size);

        if(transaction_resp.status === 1){
            res.status(config.OK_STATUS).json({"status":1,"message":"Transactions found","results":transaction_resp.results});
        } else {
            res.status(config.BAD_REQUEST).json({"status":0,"message":"Transaction not found"});
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
})

module.exports = router;