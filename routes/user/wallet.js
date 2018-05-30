var express = require("express");
var moment = require("moment");
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

/**
 * Add user's bank account using stripe connect
 * /user/wallet/add_bank_account
 * Developed by "ar"
 */
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
        let user_resp = await user_helper.get_user_by_id(req.userInfo.id);
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
                        email: user_resp.User.email,
                        legal_entity: {
                            dob: {
                                day: moment(user_resp.User.date_of_birth).date(),
                                month: moment(user_resp.User.date_of_birth).month(),
                                year: moment(user_resp.User.date_of_birth).year()
                            },
                            first_name: user_resp.User.name,
                            last_name: user_resp.User.name,
                            type: "individual"
                        },
                        external_account: bank_account_token.id
                    });

                    let update_resp = await user_helper.update_user_by_id(user_resp.User._id, { "stripe_customer_id": account.id });
                } else {
                    await stripe.accounts.createExternalAccount(
                        user_resp.User.stripe_customer_id,
                        { external_account: bank_account_token.id }
                    );
                }
                res.status(config.OK_STATUS).json({ "status": 1, "message": "Bank account has been added" });
            } catch (err) {
                res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": err.message });
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
        // Get user info
        let user_resp = await user_helper.get_user_by_id(req.userInfo.id);
        if (user_resp.status === 1 && user_resp.User.stripe_customer_id) {
            try {
                // Verify user's wallet balance and proceed further
                if (user_resp.User.wallet_balance >= req.body.amount) {

                    let charge = await stripe.charges.create({
                        amount: req.body.amount * 100,
                        currency: "aud",
                        customer: "cus_Cpn2hYxHQACXYq", // Stripe customer id of clique
                        destination: {
                            account: user_resp.User.stripe_customer_id // bank account id of user
                        },
                        description: "Charge for " + user_resp.User.name
                    });

                    if (charge) {
                        // Deduct wallet balance of user by withdrawal amount
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
            console.log("resp => ", user_resp);
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Stripe account not connected" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * Get connected bank accounts
 * /user/wallet/bank_account
 * Developed by "ar"
 */
router.get('/bank_account', async (req, res) => {
    let user_resp = await user_helper.get_user_by_id(req.userInfo.id);
    if (user_resp.status === 1) {
        if (user_resp.User.stripe_customer_id) {
            try {
                // let accounts = await stripe.customers.listSources( user_resp.User.stripe_customer_id, { limit: 100, object: "bank_account" });
                let accounts = await stripe.accounts.listExternalAccounts(user_resp.User.stripe_customer_id, { object: "bank_account" });

                let bank_account = [];
                if (accounts.data.length > 0) {
                    accounts.data.forEach((obj) => {
                        bank_account.push({
                            "id": obj.id,
                            "account_holder_name": obj.account_holder_name,
                            "bank_name": obj.bank_name,
                            "bank_Account_last4": obj.last4,
                            "bsb": obj.routing_number
                        });
                    });
                }

                if (bank_account.length > 0) {
                    if (user_resp.User.wallet_balance === undefined) {
                        user_resp.User.wallet_balance = 0;
                    }
                    res.status(config.OK_STATUS).json({ "status": 1, "message": "Bank account found", "bank_account": bank_account, "wallet_balance": user_resp.User.wallet_balance });
                } else {
                    res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No bank account found" });
                }
            } catch (err) {
                res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error occured while finding bank account", "error": err });
            }
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No bank account found" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "User details not found" });
    }

});

/**
 * Delete connected bank accounts
 * /user/wallet/bank_account/:bank_account_id
 * Developed by "ar"
 */
router.delete('/bank_account/:bank_account_id', async (req, res) => {
    let user_resp = await user_helper.get_user_by_id(req.userInfo.id);
    if (user_resp.status === 1) {
        if (user_resp.User.stripe_customer_id) {
            try {
                let resp = await stripe.accounts.deleteExternalAccount(user_resp.User.stripe_customer_id,req.params.bank_account_id);
                if(resp.deleted === true){
                    res.status(config.OK_STATUS).json({"status":1,"message":"Bank account has been removed"});
                } else {
                    res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error occured while removing bank account", "error": err });
                }
            } catch (err) {
                res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error occured while finding bank account", "error": err });
            }
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No bank account found" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "User details not found" });
    }

});

module.exports = router;