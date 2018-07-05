var express = require("express");
var router = express.Router();
var moment = require('moment');

var user_helper = require('./../../helpers/user_helper');
var global_helper = require('./../../helpers/global_helper');
var promoter_helper = require('./../../helpers/promoter_helper');
var transaction_helper = require('./../../helpers/transaction_helper');

var config = require('./../../config');


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
        if (req.body.search) {
            var regex = new RegExp(req.body.search);
            let or_filter = [{"campaign_description":{ "$regex": regex, "$options": "i" }},
                            {"search_id":{ "$regex": regex, "$options": "i" }},
                            {"brand":{ "$regex": regex, "$options": "i" }},
                            {"promoter":{ "$regex": regex, "$options": "i" }},
                            {"user":{ "$regex": regex, "$options": "i" }}];
            filter["$or"] = or_filter;
        }

        var sort = {};
        if (req.body.sort) {
            req.body.sort.forEach(sort_criteria => {
                sort[sort_criteria.field] = sort_criteria.value;
            });
        }

        if (Object.keys(sort).length === 0) {
            sort["date"] = -1;
        }

        let transaction_resp = await transaction_helper.get_all_transaction(filter, sort, req.body.page_no, req.body.page_size);

        if (transaction_resp.status === 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Transactions found", "results": transaction_resp.results });
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Transaction not found" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

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
        if (req.body.search) {
            var regex = new RegExp(req.body.search);
            let or_filter = [{"name":{ "$regex": regex, "$options": "i" }},
                            {"type":{ "$regex": regex, "$options": "i" }}]
            match_filter["$or"] = or_filter;
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
            "name":"sortname"
        };

        match_filter = await global_helper.rename_keys(match_filter, keys);
        sort = await global_helper.rename_keys(sort, keys);

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

router.get('/user/suspend/:user_id', async (req, res) => {
    var update_obj = {
        "status": false
    }

    let update_resp = await user_helper.update_user_by_id(req.params.user_id, update_obj)

    if (update_resp.status === 1) {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "User has been suspended" });
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Can't suspend this user" });
    }
});

router.get('/user/remove/:user_id', async (req, res) => {
    var update_obj = {
        "removed": true
    }

    let update_resp = await user_helper.update_user_by_id(req.params.user_id, update_obj)

    if (update_resp.status === 1) {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "User has been removed" });
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Can't remove this user" });
    }
});

router.get('/promoter/suspend/:promoter_id', async (req, res) => {
    var update_obj = {
        "status": false
    }

    let update_resp = await promoter_helper.update_promoter_by_id(req.params.promoter_id, update_obj)

    if (update_resp.status === 1) {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "User has been suspended" });
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Can't suspend this user" });
    }
});

router.get('/promoter/remove/:promoter_id', async (req, res) => {
    var update_obj = {
        "removed": true
    }

    let update_resp = await promoter_helper.update_promoter_by_id(req.params.promoter_id, update_obj)

    if (update_resp.status === 1) {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "User has been removed" });
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Can't remove this user" });
    }
});

module.exports = router;