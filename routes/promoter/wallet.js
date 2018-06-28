var express = require("express");
var router = express.Router();
var moment = require("moment");

var config = require('./../../config');
var cart_helper = require('./../../helpers/cart_helper');
var promoter_helper = require('./../../helpers/promoter_helper');

var stripe = require("stripe")(config.STRIPE_SECRET_KEY);
var logger = config.logger;


/**
 * get wallet balance
 * /promoter/wallet/balance
 * Developed by "ar"
 */
router.get('/balance', async (req, res) => {
    try {
        let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
        if (promoter_resp.status === 1) {
            if (promoter_resp.promoter.wallet_balance) {
                res.status(config.OK_STATUS).json({ "status": 1, "message": "Wallet balance found", "balance": promoter_resp.promoter.wallet_balance });
            } else {
                res.status(config.OK_STATUS).json({ "status": 1, "message": "Wallet balance found", "balance": 0 });
            }
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error in finding promoter" });
        }
    } catch (err) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error in fetching wallet balance" });
    }
});

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
        },
        'bank_account': {
            notEmpty: true,
            errorMessage: "Bank account is required"
        }
    };

    req.checkBody(schema);
    const errors = req.validationErrors();

    if (!errors) {
        // Get promoter info
        let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
        console.log("Promoter resp ==> ",promoter_resp);
        if (promoter_resp.status === 1 && promoter_resp.promoter.stripe_connect_id) {

            try {
                // Verify user's wallet balance and proceed further
                if (promoter_resp.promoter.wallet_balance >= req.body.amount) {

                    let transfer = await stripe.transfers.create({
                        amount: req.body.amount * 100,
                        currency: "aud",
                        destination: promoter_resp.promoter.stripe_connect_id
                    });

                    // let charge = await stripe.charges.create({
                    //     amount: req.body.amount * 100,
                    //     currency: "usd",
                    //     customer: "cus_Cpn2hYxHQACXYq", // Stripe customer id of clique
                    //     destination: {
                    //         account: "acct_1AL7EZB6ThHUGP1p" // bank account id of promoter
                    //     },
                    //     description: "Charge for " + promoter_resp.promoter.name
                    // });

                    if (transfer) {
                        // Deduct wallet balance of promoter by withdrawal amount
                        let updated_promoter = await promoter_helper.update_promoter_by_id(req.userInfo.id, { "wallet_balance": promoter_resp.promoter.wallet_balance - req.body.amount });

                        res.status(config.OK_STATUS).json({ "status": 1, "message": "Chard has been created" });
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

/**
 * Get connected bank accounts
 * /promoter/wallet/bank_account
 * Developed by "ar"
 */
router.get('/bank_account', async (req, res) => {
    let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
    if (promoter_resp.status === 1) {
        if (promoter_resp.promoter.stripe_connect_id) {
            try {
                let accounts = await stripe.accounts.listExternalAccounts(promoter_resp.promoter.stripe_connect_id, { object: "bank_account" });

                let bank_account = [];
                if (accounts.data.length > 0) {
                    accounts.data.forEach((obj) => {
                        console.log("obj ==> ",obj);
                        bank_account.push({
                            "id": obj.id,
                            "account_holder_name": obj.account_holder_name,
                            "bank_name": obj.bank_name,
                            // "bank_name": obj.metadata.bank_name,
                            "bank_Account_last4": obj.last4,
                            "bsb": obj.routing_number,
                            "default":obj.default_for_currency
                        });
                    });
                }

                if (promoter_resp.promoter.wallet_balance === undefined) {
                    promoter_resp.promoter.wallet_balance = 0;
                }

                if (bank_account.length > 0) {
                    res.status(config.OK_STATUS).json({ "status": 1, "message": "Bank account found", "bank_account": bank_account, "wallet_balance":promoter_resp.promoter.wallet_balance });
                } else {
                    res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No bank account found","wallet_balance":promoter_resp.promoter.wallet_balance });
                }
            } catch (err) {
                res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error occured while finding bank account", "error": err });
            }
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No bank account found" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Promoter details not found" });
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
        let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
        if (promoter_resp.status === 1) {
            try {
                let bank_account_token = await stripe.tokens.create({
                    bank_account: {
                        account_number: req.body.account_number,
                        country: 'AU',
                        currency: 'aud',
                        account_holder_name: req.body.account_name,
                        account_holder_type: 'individual',
                        routing_number: req.body.bsb,
                        metadata: {
                            bank_name: req.body.bank_name
                        }
                    }
                });

                if (!promoter_resp.promoter.stripe_connect_id) {
                    // create new stripe connect account
                    let account = await stripe.accounts.create({
                        type: 'custom',
                        country: 'AU',
                        email: promoter_resp.promoter.email,
                        legal_entity: {
                            dob: {
                                day: moment(promoter_resp.promoter.date_of_birth).date(),
                                month: moment(promoter_resp.promoter.date_of_birth).month(),
                                year: moment(promoter_resp.promoter.date_of_birth).year()
                            },
                            first_name: promoter_resp.promoter.full_name,
                            last_name: promoter_resp.promoter.full_name,
                            type: "individual"
                        },
                        external_account: bank_account_token.id
                    });

                    let update_resp = await promoter_helper.update_promoter_by_id(promoter_resp.promoter._id, { "stripe_connect_id": account.id });
                } else {
                    await stripe.accounts.createExternalAccount(
                        promoter_resp.promoter.stripe_connect_id,
                        { external_account: bank_account_token.id }
                    );
                }
                res.status(config.OK_STATUS).json({ "status": 1, "message": "Bank account has been added" });
            } catch (err) {
                res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": err.message });
            }
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Can't find given promoter" });
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * Delete connected bank accounts
 * /user/wallet/bank_account/:bank_account_id
 * Developed by "ar"
 */
router.delete('/bank_account/:bank_account_id', async (req, res) => {
    let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
    if (promoter_resp.status === 1) {
        if (promoter_resp.promoter.stripe_connect_id) {
            try {
                let resp = await stripe.accounts.deleteExternalAccount(promoter_resp.promoter.stripe_connect_id, req.params.bank_account_id);
                if (resp.deleted === true) {
                    res.status(config.OK_STATUS).json({ "status": 1, "message": "Bank account has been removed" });
                } else {
                    res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error occured while removing bank account", "error": err });
                }
            } catch (err) {
                console.log("Error while deleting external account ==> ",err);
                res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error occured while finding bank account", "error": err });
            }
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No bank account found" });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Promoter not found" });
    }
});


/**
 * Add credit card using stripe
 */
router.post('/credit_card', async (req, res) => {
    var schema = {
        "card_holder_name": {
            notEmpty: true,
            errorMessage: "Card holder name is required"
        },
        "card_number": {
            notEmpty: true,
            errorMessage: "Card number is required"
        },
        "expiry_month": {
            notEmpty: true,
            errorMessage: "Expiry date is required"
        },
        "expiry_year": {
            notEmpty: true,
            errorMessage: "Expiry date is required"
        },
        "cvv": {
            notEmpty: true,
            errorMessage: "CVV is required"
        }
    };

    req.checkBody(schema);
    var errors = req.validationErrors();

    if (!errors) {
        let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
        if (promoter_resp.status === 1) {
            try {
                let token = await stripe.tokens.create({
                    card: {
                        "number": req.body.card_number,
                        "exp_month": req.body.expiry_month,
                        "exp_year": req.body.expiry_year,
                        "cvc": req.body.cvv,
                        "name": req.body.card_holder_name.trim()
                    }
                });

                let card = await stripe.customers.createSource(promoter_resp.promoter.stripe_customer_id,
                    {
                        source: token.id
                    });

                if (card) {
                    res.status(config.OK_STATUS).json({ "status": 1, "message": "Card has been added" });
                } else {
                    res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error occured while adding card" });
                }
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
 * Edit credit card using stripe
 */
router.put('/credit_card', async (req, res) => {
    var schema = {
        "card_id": {
            notEmpty: true,
            errorMessage: "Card id is required"
        },
        "card_holder_name": {
            notEmpty: true,
            errorMessage: "Card holder name is required"
        },
        "expiry_month": {
            notEmpty: true,
            errorMessage: "Expiry date is required"
        },
        "expiry_year": {
            notEmpty: true,
            errorMessage: "Expiry date is required"
        }
    };

    req.checkBody(schema);
    var errors = req.validationErrors();

    if (!errors) {
        let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
        if (promoter_resp.status === 1) {
            try {
                let card = await stripe.customers.updateCard(
                    promoter_resp.promoter.stripe_customer_id,
                    req.body.card_id,
                    {
                        "name": req.body.card_holder_name.trim(),
                        "exp_month": req.body.expiry_month,
                        "exp_year": req.body.expiry_year
                    }
                );

                if (card) {
                    res.status(config.OK_STATUS).json({ "status": 1, "message": "Card has been updated" });
                } else {
                    res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error occured while updating card" });
                }
            } catch (err) {
                res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": err.message });
            }
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Can't find given promoter" });
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * Delete credit card
 */
router.delete('/credit_card/:card_id', async (req, res) => {
    let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
    if (promoter_resp.status === 1) {
        try{
            let card = await stripe.customers.deleteCard(promoter_resp.promoter.stripe_customer_id,req.params.card_id);
            if(card.deleted){
                res.status(config.OK_STATUS).json({"status":1,"message":"Card has been deleted"});
            } else {
                res.status(config.BAD_REQUEST).json({"status":0,"message":"Erorr occured while deleting card"});
            }
        } catch(err){
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while deleting card", "error":err });
        }
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Promoter not found" });
    }
});

module.exports = router;