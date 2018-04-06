var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");
var router = express.Router();

var config = require('./../../config');
var user_helper = require('./../../helpers/user_helper');
var logger = config.logger;

/** 
 * @api {post} /promoter/user Get all user
 * @apiName Get all user
 * @apiGroup Promoter-User
 * 
 * @apiDescription  Get all user
 * 
 * @apiHeader {String}  x-access-token promoter's unique access-key
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {Array} [filter] Filter array contains field by which records need to filter
 * @apiParam {Array} [sort] Sort field array contains field by which records need to sort
 * @apiParam {Number} page_size Total number of record on page
 * @apiParam {Number} page_no Current page
 * 
 * @apiSuccess (Success 200) {Array} users Users details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/', async(req,res) => {

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
        if(req.body.filter){
            req.body.filter.forEach(filter_criteria => {
                if(filter_criteria.type === "exact"){
                    console.log("inside");
                    match_filter[filter_criteria.field] = filter_criteria.value;
                    console.log("filter = ",match_filter);
                } else if(filter_criteria.type === "between"){
                    
                }
            });
        }
        console.log("outside");

        var users = await user_helper.get_filtered_user(req.body.page_no,req.body.page_size,match_filter);
        if(users.status === 1){
            res.status(config.OK_STATUS).json({"status":1,"message":"Users found","users":users.users});
        } else {
            res.status(config.BAD_REQUEST).json({"status":0,"message":"Users not found"});
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

module.exports = router;