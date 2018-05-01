var express = require("express");
var router = express.Router();

var config = require('./../../config');
var cart_helper = require('./../../helpers/cart_helper');
var promoter_helper = require('./../../helpers/promoter_helper');

var stripe = require("stripe")(config.STRIPE_SECRET_KEY);

/**
 * Get card of loggedin user
 * /promoter/wallet/cards
 * Developed by "ar"
 */
router.get('/cards',async(req,res) => {
    let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
    if(promoter_resp.status === 1 && promoter_resp.promoter.stripe_customer_id){
        let cards = await stripe.customers.listCards(promoter_resp.promoter.stripe_customer_id);
        res.status(config.OK_STATUS).json({"status":1,"message":"Card available","cards":cards.data});
    } else {
        console.log("resp => ",promoter_resp);
        res.status(config.BAD_REQUEST).json({"status":0,"message":"No card available"});
    }
});

module.exports = router;