var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");

var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var user_helper = require("./../../helpers/user_helper");




/** 
 * @api {post} /user/profile/create_profile Create Profile
 * @apiName Profile - Add
 * @apiGroup User

 * @apiHeader {String}  Content-Type application/json
 * @apiHeader {String}  x-access-token  unique access-key
 * 
 * @apiParam {String} name Name of profile
 * @apiParam {String} username Username of profile
 *  @apiParam {String} email Email of profile
 *  @apiParam {String} job_industry Job Industry of profile
 *  @apiParam {String} music_taste Music Taste of profile
 *  @apiParam {String} interest Interest of profile 

 * @apiSuccess (Success 200) {JSON}profile details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post("/create_profile", async (req, res) => {
    user_id = req.userInfo.id;
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
        var obj = {
            "name": req.body.name,
            "username": req.body.username,
            "email": req.body.email,
            "user_interest": req.body.user_interest,
            "job_industry": req.body.job_industry,
            "music_taste": req.body.music_taste
        };
        console.log(obj);
        let user_data = await user_helper.insert_user(obj);
        if (user_data.status === 0) {
            logger.error("Error while updating User data = ", user_data);
            return res.status(config.BAD_REQUEST).json({ user_data });
        } else {
            return res.status(config.OK_STATUS).json(user_data);
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }

});




/**
 * @api {post} /user/profile/bank_detail Update bank detail
 * @apiName Update bank detail
 * @apiGroup User
 * 
 * @apiHeader {String}  Content-Type application/json
 * @apiHeader {String}  x-access-token  unique access-key
 * 
 * @apiParam {Number} id User Id
 * @apiParam {String} bank_name User Bank name
 * @apiParam {Number} account_no User Bank Account Number
 * @apiParam {String} account_name User Bank Account Name
 * @apiParam {Number} bsb User bsb
 
 * @apiSuccess (Success 200) {JSON} bank detail
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.post("/bank_detail", async (req, res) => {
    user_id = req.userInfo.id;
    var schema = {

        "bank_name": {
            notEmpty: true,
            errorMessage: "Bank Name is required"
        },
        "bsb": {
            notEmpty: true,
            errorMessage: "BSB is required"
        },
        "account_number": {
            notEmpty: true,
            errorMessage: "Account Number is required"
        },
        "account_name": {
            notEmpty: true,
            errorMessage: "Account Name is required"
        },

    };
    req.checkBody(schema);
    var errors = req.validationErrors();

    if (!errors) {
        var obj = {
            "bank_name": req.body.bank_name,
            "account_number": req.body.account_number,
            "account_name": req.body.account_name,
            "bsb": req.body.bsb
        };
        console.log(obj);
        let user_data = await user_helper.add_bank_to_user(user_id, obj);
        if (user_data.status === 0) {
            logger.error("Error while updating User data = ", user_data);
            return res.status(config.BAD_REQUEST).json({ user_data });
        } else {
            return res.status(config.OK_STATUS).json(user_data);
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }

});



/*update */

router.put("/:id", async (req, res) => {
    user_id = req.userInfo.id;
    logger.trace("Get all Offered Campaign API called");
    var resp_data = await user_helper.bank_detail_update(user_id,req.params.id,req.body);
    if (resp_data.status == 0) {
      logger.error("Error occured while fetching offered Campaign = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
      logger.trace("Offered Campaign got successfully = ", resp_data);
      res.status(config.OK_STATUS).json(resp_data);
    }
  });

/**
 * @api {get} /user/profile/bank_detail Bank detail - Get 
 * @apiName get_profile_by_id - Get
 * @apiGroup User
 *
 * @apiHeader {String}  x-access-token unique access-key
 *
 * @apiSuccess (Success 200) {Array} bank detail as per id
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/bank_detail", async (req, res) => {
    user_id = req.userInfo.id;
    logger.trace("Get all Bank Detail API called");
    var resp_data = await user_helper.get_bank_detail(user_id);
    if (resp_data.status == 0) {
        logger.error("Error occured while fetching Bank Detail = ", resp_data);
        res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
        logger.trace("Bank Detail got successfully = ", resp_data);
        res.status(config.OK_STATUS).json(resp_data);
    }
});

module.exports = router;