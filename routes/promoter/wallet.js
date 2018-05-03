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

                // Generating token for clique's bank account
                let token = await stripe.tokens.create({
                    bank_account: {
                        country: 'US',
                        currency: 'usd',
                        account_holder_name: 'Liam Martin',
                        account_holder_type: 'individual',
                        routing_number: '110000000',
                        account_number: '000123456789'
                    }
                });

                let charge = await stripe.charges.create({
                    amount: req.body.amount * 100,
                    currency: "usd",
                    // source: token,
                    customer: promoter_resp.promoter.stripe_customer_id,
                    destination: promoter_resp.promoter.stripe_customer_id,
                    description: "Charge for " + promoter_resp.promoter.name
                });

                res.status(config.OK_STATUS).json({ "status": 1, "message": "Card available", "cards": cards.data });
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