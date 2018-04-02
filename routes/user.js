var express = require("express");
var router = express.Router();

var auth = require("./../middlewares/auth");
var authorization = require("./../middlewares/authorization");

var campaign = require("./user/campaign");
var brand = require("./user/brand");
var profile = require("./user/profile");


router.use("/campaign",auth, authorization, campaign);
router.use("/promoter",auth, authorization, brand);
router.use("/profile",auth, authorization, profile);


module.exports = router;