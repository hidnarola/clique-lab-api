var express = require("express");
var router = express.Router();

var auth = require("./../middlewares/auth");
var authorization = require("./../middlewares/authorization");

var campaign = require("./user/campaign");
var brand = require("./user/brand");
var profile = require("./user/profile");
var bank = require("./user/wallet_screen");

router.use("/campaign",auth, authorization, campaign);
router.use("/promoter",auth, authorization, brand);
router.use("/profile",auth, authorization, profile);
router.use("/bank_detail",auth, authorization, bank);



module.exports = router;