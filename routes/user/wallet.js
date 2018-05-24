var express = require("express");
var router = express.Router();

var config = require("./../../config");
var stripe = require("stripe")(config.STRIPE_SECRET_KEY);
var logger = config.logger;

var user_helper = require("./../../helpers/user_helper");

/**
 * /user/wallet/balance
 * Get wallet balance of logged-in user
 * Developed by "ar"
 */
router.get('/balance', async (req, res) => {
    try {
        let user_resp = await user_helper.get_user_by_id(req.userInfo.id);
        if (user_resp.status === 1) {
            if (user_resp.User.wallet_balance === undefined) {
                user_resp.User.wallet_balance = 0;
            }
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Wallet balance has been found", "wallet_balance": user_resp.User.wallet_balance });
        } else if (user_resp.status === 2) {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No user available" });
        } else {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error has occured while finding wallat balance for user", "error": user_resp.error });
        }
    } catch (err) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error has occured while finding wallat balance for user", "error": err });
    }
});

router.post('/add_bank_account', async (req, res) => {
    var schema = {
        "bank_name": {
            notEmpty: true,
            errorMessage: "Bank Name is required"
        },
        "bsb": {
            notEmpty: true,
            errorMessage: "BSB is required"
        },
        "account_number": {
            notEmpty: true,
            errorMessage: "Account Number is required"
        },
        "account_name": {
            notEmpty: true,
            errorMessage: "Account Name is required"
        }
    };

    req.checkBody(schema);
    var errors = req.validationErrors();

    if (!errors) {
        let user_resp = user_helper.get_user_by_id(req.userInfo.id);
        if (user_resp.status === 1) {

            try {
                let bank_account_token = await stripe.tokens.create({
                    bank_account: {
                        account_number: req.body.account_number,
                        country: 'AU',
                        currency: 'aud',
                        account_holder_name: req.body.account_name,
                        account_holder_type: 'individual',
                        routing_number: req.body.bsb
                    }
                });

                console.log("Bank account ===> ", bank_account_token);

                if (!user_resp.User.stripe_customer_id) {
                    // create new stripe account
                    // Create stripe account of customer

                    let account = await stripe.accounts.create({
                        type: 'custom',
                        country: 'AU',
                        email: user_resp.User.email
                    });

                    console.log("created account ==> ",account);

                    let update_resp = await user_helper.update_user_by_id(user_resp.User._id, { "stripe_customer_id": customer.id });

                    stripe_id = customer.id;

                } else {
                    stripe_id = user_resp.User.stripe_customer_id;
                }

            } catch (err) {
                res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error while creating bank account", "error": err });
            }

        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Can't find given user" });
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * Withdraw given amount from wallet
 * /user/wallet/withdraw
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
        let user_resp = await user_helper.get_user_by_id(req.userInfo.id);
        if (user_resp.status === 1 && user_resp.User.stripe_customer_id) {
            try {
                // Verify user's wallet balance and proceed further
                if (user_resp.User.wallet_balance >= req.body.amount) {

                    let charge = await stripe.charges.create({
                        amount: req.body.amount * 100,
                        currency: "usd",
                        customer: "cus_Cpn2hYxHQACXYq", // Stripe customer id of clique
                        destination: {
                            account: "acct_1AL7EZB6ThHUGP1p" // bank account id of user
                        },
                        description: "Charge for " + user_resp.User.name
                    });

                    if (charge) {
                        // Deduct wallet balance of promoter by withdrawal amount
                        let updated_user = await user_helper.update_user_by_id(req.userInfo.id, { "wallet_balance": user_resp.user.wallet_balance - req.body.amount });

                        res.status(config.OK_STATUS).json({ "status": 1, "message": "Charge has been created", "charge": charge });
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