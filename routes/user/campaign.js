var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");

var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var campaign_helper = require("./../../helpers/campaign_helper");
/**
 * @api {get} /user_id campaigns - Get by ID
 * @apiName campaigns - Get campaigns by ID

 *
 * @apiHeader {String}  x-access-token  unique access-key
 * * @apiParam {String} user_id ID of campaigns

 * @apiSuccess (Success 200) {Array} exercise Array of campaigns 
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/", async (req, res) => {
 
   user_id = req.userInfo.id;
   logger.trace("Get all campaign API called");
  var resp_data = await campaign_helper.get_user_id(user_id);
   if (resp_data.status == 0) {
     logger.error("Error occured while fetching campaign = ", resp_data);
     res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
  } else {
    logger.trace("Campaigns got successfully = ", resp_data);
     res.status(config.OK_STATUS).json(resp_data);
   }
});


/**
 * @api {get} user/public_campaign Campaign  - Get all
 * @apiName public campaign - Get all
 *
 * @apiHeader {String}  x-access-token unique access-key
 *
 * @apiSuccess (Success 200) {Array} capaign Array of bodyparts document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/public_campaign", async (req, res) => {
  logger.trace("Get all Public Campaign API called");
  var resp_data = await campaign_helper.get_all_campaign();
  if (resp_data.status == 0) {
    logger.error("Error occured while fetching Public Campaign = ", resp_data);
    res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
  } else {
    logger.trace("Public Campaign got successfully = ", resp_data);
    res.status(config.OK_STATUS).json(resp_data);
  }
});
module.exports = router;