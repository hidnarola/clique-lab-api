var express = require("express");
var router = express.Router();

var auth = require("./../middlewares/auth");
var authorization = require("./../middlewares/authorization");

var campaign = require("./user/campaign");

router.use("/campaign",auth, authorization, campaign);

module.exports = router;