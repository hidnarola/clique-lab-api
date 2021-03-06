var express = require("express");
var router = express.Router();

var auth = require("./../middlewares/auth");
var authorization = require("./../middlewares/authorization");

var index = require("./user/index");
var campaign = require("./user/campaign");
var brand = require("./user/brand");
var profile = require("./user/profile");
var wallet = require("./user/wallet");
var transaction = require("./user/transaction");
var notification = require("./user/notification");
var leaderboard = require("./user/leaderboard");

router.use("/",auth, authorization, index);
router.use("/campaign",auth, authorization, campaign);
router.use("/promoter",auth, authorization, brand);
router.use("/profile",auth, authorization, profile);
router.use("/wallet",auth, authorization, wallet);
router.use("/transaction",auth, authorization, transaction);
router.use("/notification",auth, authorization, notification);
router.use("/leaderboard",auth, authorization, leaderboard);
//router.use("/bank_detail",auth, authorization, bank);

module.exports = router;