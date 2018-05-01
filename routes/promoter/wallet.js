var express = require("express");
var router = express.Router();

var config = require('./../../config');
var cart_helper = require('./../../helpers/cart_helper');
var transaction_helper = require('./../../helpers/transaction_helper');
var promoter_helper = require('./../../helpers/promoter_helper');

var stripe = require("stripe")(config.STRIPE_SECRET_KEY);

router.get('/cards',async(req,res) => {
    
});

module.exports = router;