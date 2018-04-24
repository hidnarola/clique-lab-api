var express = require("express");
var router = express.Router();

var auth = require("./../middlewares/auth");
var authorization = require("./../middlewares/authorization");

var index = require("./promoter/index");
var campaign = require("./promoter/campaign");
var inspired_submission = require("./promoter/inspired_submission");
var user = require("./promoter/user");
var group = require("./promoter/group");

router.use("/",auth, authorization, index);
router.use("/campaign", campaign);
router.use("/inspired_submission", inspired_submission);
router.use("/user", user);
router.use("/group", group);

module.exports = router;