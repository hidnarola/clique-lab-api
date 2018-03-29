var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");

var router = express.Router();

var config = require("./../config");
var logger = config.logger;

var job_industry = require("../helpers/job_industry_helper");




/**
 * @api {get} user/job_industry Interest Parts - Get all
 * @apiName get_interest - Get all
 * @apiGroup Admin
 *
 * @apiHeader {String}  x-access-token Admin's unique access-key
 *
 * @apiSuccess (Success 200) {Array} bodyparts Array of bodyparts document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/job_industry", async (req, res) => {

    logger.trace("Get all Job industry API called");
    var resp_data = await job_industry.get_all_job_industry();
    if (resp_data.status == 0) {
      logger.error("Error occured while fetching Job Industry = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
      logger.trace("Job Industry got successfully = ", resp_data);
      res.status(config.OK_STATUS).json(resp_data);
    }
  });

module.exports = router;
