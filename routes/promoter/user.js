var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");
var router = express.Router();

var config = require('./../../config');
var user_helper = require('./../../helpers/user_helper');
var logger = config.logger;

/** 
 * @api {get} /promoter/user Get all user
 * @apiName Get all user
 * @apiGroup Promoter-User
 * 
 * @apiDescription  Get all user
 * 
 * @apiHeader {String}  x-access-token promoter's unique access-key
 * 
 * @apiSuccess (Success 200) {Array} users Users details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/', async(req,res) => {
    var users = await user_helper.get_all_user();
    if(users.status === 1){
        res.status(config.OK_STATUS).json({"status":1,"message":"Users found","users":users.users});
    } else {
        res.status(config.BAD_REQUEST).json({"status":0,"message":"Users not found"});
    }
});

module.exports = router;