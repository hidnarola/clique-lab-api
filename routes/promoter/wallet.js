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
router.get('/cards', async (req, res) => {
    let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
    if (promoter_resp.status === 1 && promoter_resp.promoter.stripe_customer_id) {
        let cards = await stripe.customers.listCards(promoter_resp.promoter.stripe_customer_id);
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Card available", "cards": cards.data });
    } else {
        console.log("resp => ", promoter_resp);
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No card available" });
    }
});

/**
 * Withdraw given amount from wallet
 * /promoter/wallet/withdraw
 * Developed by "ar"
 */
router.post('/withdraw', async (req, res) => {
    var schema = {
        'amount': {
            notEmpty: true,
            errorMessage: "Withdrawal amount is required"
        }
    };

    req.checkBody(schema);
    const errors = req.validationErrors();

    if (!errors) {
        // Get promoter info
        let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
        if (promoter_resp.status === 1 && promoter_resp.promoter.stripe_customer_id) {

            try {
                // Verify user's wallet balance and proceed further
                if (promoter_resp.promoter.wallet_balance >= req.body.amount) {

                    let charge = await stripe.charges.create({
                        amount: req.body.amount * 100,
                        currency: "usd",
                        customer: "cus_Cpn2hYxHQACXYq", // Stripe customer id of clique
                        destination: {
                            account: "acct_1AL7EZB6ThHUGP1p" // bank account id of promoter
                        },
                        description: "Charge for " + promoter_resp.promoter.name
                    });

                    if (charge) {
                        // Deduct wallet balance of promoter by withdrawal amount
                        let updated_promoter = await promoter_helper.update_promoter_by_id(req.userInfo.id, { "wallet_balance": promoter_resp.promoter.wallet_balance - req.body.amount });

                        res.status(config.OK_STATUS).json({ "status": 1, "message": "Chard has been created", "charge": charge });
                    } else {
                        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured in creating charge" });
                    }
                } else {
                    res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Insufficient wallet balance" });
                }
            } catch (err) {
                console.log("err => ", err);
                res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured in withrawal" });
            }
        } else {
            console.log("resp => ", promoter_resp);
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Stripe account not connected" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

module.exports = router;