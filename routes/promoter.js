var express = require("express");
var router = express.Router();

var auth = require("./../middlewares/auth");
var authorization = require("./../middlewares/authorization");

var index = require("./promoter/index");
var campaign = require("./promoter/campaign");
var user = require("./promoter/user");
var group = require("./promoter/group");

router.use("/",auth, authorization, index);
router.use("/campaign", campaign);
router.use("/user", user);
router.use("/group", group);

module.exports = router;