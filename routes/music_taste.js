var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");

var router = express.Router();

var config = require("./../config");
var logger = config.logger;

var music_taste = require("../helpers/music_taste_helper");




/**
 * @api {get} user/job_interest Interest Parts - Get all
 * @apiName get_interest - Get all
 * @apiGroup Admin
 *
 * @apiHeader {String}  x-access-token Admin's unique access-key
 *
 * @apiSuccess (Success 200) {Array} bodyparts Array of bodyparts document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/music_taste", async (req, res) => {
    logger.trace("Get all Music Taste API called");
    var resp_data = await music_taste.get_all_music_taste();
    if (resp_data.status == 0) {
      logger.error("Error occured while fetching Music Taste = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
      logger.trace("Music Taste got successfully = ", resp_data);
      res.status(config.OK_STATUS).json(resp_data);
    }
  });

module.exports = router;
