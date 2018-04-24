var express = require("express");
var moment = require("moment");
var mongoose = require('mongoose');
var router = express.Router();

var config = require('./../../config');

var global_helper = require("./../../helpers/global_helper");

var logger = config.logger;
var ObjectId = mongoose.Types.ObjectId;

/**
 * Get all inspired submission with filtering and sorting
 * /promoter/inspired_submission
 * Developed by "ar"
 */
router.post('/',async (req,res) => {
    
});

module.exports = router;