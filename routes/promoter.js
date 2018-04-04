var express = require("express");
var router = express.Router();

var auth = require("./../middlewares/auth");
var authorization = require("./../middlewares/authorization");

var index = require("./promoter/index");
var campaign = require("./promoter/campaign");
var user = require("./promoter/user");

router.use("/",auth, authorization, index);
router.use("/campaign", campaign);
router.use("/user", user);

module.exports = router;