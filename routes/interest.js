var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");

var router = express.Router();

var config = require("./../config");
var logger = config.logger;

var interest_helper = require("../helpers/interest_helper");




/**
 * @api {get} /admin/bodypart Body Parts - Get all
 * @apiName Body Parts - Get all
 * @apiGroup Admin
 *
 * @apiHeader {String}  x-access-token Admin's unique access-key
 *
 * @apiSuccess (Success 200) {Array} bodyparts Array of bodyparts document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/interest", async (req, res) => {

    logger.trace("Get all Interest API called");
    var resp_data = await interest_helper.get_all_interest();
    if (resp_data.status == 0) {
      logger.error("Error occured while fetching interest = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
      logger.trace("Interest got successfully = ", resp_data);
      res.status(config.OK_STATUS).json(resp_data);
    }
  });

module.exports = router;
