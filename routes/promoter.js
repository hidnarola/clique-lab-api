var express = require("express");
var router = express.Router();

var auth = require("./../middlewares/auth");
var authorization = require("./../middlewares/authorization");

var index = require("./promoter/index");
var campaign = require("./promoter/campaign");
var inspired_submission = require("./promoter/inspired_submission");
var user = require("./promoter/user");
var group = require("./promoter/group");
var purchase_post = require("./promoter/purchase_post");
var cart = require("./promoter/cart");
var wallet = require("./promoter/wallet");
var faq = require("./promoter/faq");
var referral = require("./promoter/referral");
var transaction = require("./promoter/transaction");

router.use("/",auth, authorization, index);
router.use("/campaign", campaign);
router.use("/inspired_submission", inspired_submission);
router.use("/user", user);
router.use("/group", group);
router.use("/purchase_post", purchase_post);
router.use("/cart", cart);
router.use("/wallet", wallet);
router.use("/faq", faq);
router.use("/referral", referral);
router.use("/transaction", transaction);

module.exports = router;