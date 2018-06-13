var express = require("express");
var moment = require("moment");

var router = express.Router();

var config = require('./../../config');

var transaction_helper = require('./../../helpers/transaction_helper');

/**
 * /promoter/transaction
 */
router.post('/', async (req, res) => {
    var schema = {
        'page_no': {
            notEmpty: true,
            errorMessage: "page number is required"
        },
        'page_size': {
            notEmpty: true,
            errorMessage: "page size is required"
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

        let transaction_resp = await transaction_helper.get_transaction_by_promoter(req.userInfo.id,filter,req.body.page_no,req.body.page_size);

        if(transaction_resp.status === 1){
            res.status(config.OK_STATUS).json({"status":1,"message":"Transactions found","results":transaction_resp.results});
        } else {
            res.status(config.BAD_REQUEST).json({"status":0,"message":"Transaction not found"});
        }
    } else {
        res.status(config.BAD_REQUEST).json({ "status":0, "message": errors });
    }
});

module.exports = router;