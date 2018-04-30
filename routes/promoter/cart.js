var express = require("express");
var router = express.Router();

var config = require('./../../config');
var cart_helper = require('./../../helpers/cart_helper');
var transaction_helper = require('./../../helpers/transaction_helper');
var promoter_helper = require('./../../helpers/promoter_helper');

var stripe = require("stripe")(config.STRIPE_SECRET_KEY);

/**
 * Get cart product
 * /promoter/cart
 * Developed by "ar"
 */
router.get('/', async (req, res) => {
    var cart_item_resp = await cart_helper.view_cart_details_by_promoter(req.userInfo.id);
    if (cart_item_resp.status === 0) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while finding cart details", "error": cart_item_resp.error });
    } else if (cart_item_resp.status === 2) {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No cart item available" });
    } else {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Cart items found", "results": cart_item_resp.results });
    }
});

/**
 * Purchase Item available in cart
 * /promoter/cart/purchase
 * Developed by "ar"
 */
router.post('/purchase', async (req, res) => {
    var schema = {
        'name': {
            notEmpty: true,
            errorMessage: "Name is required"
        },
        'email': {
            notEmpty: true,
            errorMessage: "Email is required"
        },
        'abn': {
            notEmpty: true,
            errorMessage: "ABN is required"
        },
        'country': {
            notEmpty: true,
            errorMessage: "Country is required"
        },
        'address_line_1': {
            notEmpty: true,
            errorMessage: "Address line 1 is required"
        },
        'address_line_2': {
            notEmpty: true,
            errorMessage: "Address line 2 is required"
        },
        'city': {
            notEmpty: true,
            errorMessage: "City is required"
        },
        'state': {
            notEmpty: true,
            errorMessage: "State is required"
        },
        'post_code': {
            notEmpty: true,
            errorMessage: "Post code is required"
        },
        'credit_card': {
            notEmpty: true,
            errorMessage: "Credit card is required"
        }
    };
    req.checkBody(schema);
    const errors = req.validationErrors();
    if (!errors) {

        // Fetch currently active cart
        let transaction_obj = {
            "promoter_id": req.userInfo.id,
            "name": req.body.name,
            "email": req.body.email,
            "abn": req.body.abn,
            "country": req.body.country,
            "address_line1": req.body.address_line_1,
            "address_line2": req.body.address_line_2,
            "city": req.body.city,
            "state": req.body.state,
            "post_code": req.body.post_code,
            "credit_card": req.body.credit_card
        };

        if (req.body.company) {
            transaction_obj.company = req.body.company;
        }

        let transaction_resp = await transaction_helper.insert_transaction(transaction_obj);

        if (transaction_resp.status === 1) {
            // get user's stripe account
            let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
            if (promoter_resp.status === 1 && promoter_resp.promoter && promoter_resp.promoter.stripe_customer_id) {
                try {

                    // Fetch user's active cart

                    let charge = await stripe.charges.create({
                        "amount": 220,
                        "currency": "usd",
                        "capture": false,
                        "customer": promoter_resp.promoter.stripe_customer_id,
                        "statement_descriptor": "Clique purchase", // lentgth must be 22 character max.
                        "metadata": {
                            "CHARGETYPE": "Authorization ONLY",
                            "subtotal": 200,
                            "GST": 20,
                            "userID": req.userInfo.id
                        }
                    });

                    let updated_transaction = await transaction_helper.update_transaction_by_id(transaction_resp.transaction._id, { "status": "paid" });

                    // Clear active cart here

                    res.status(config.OK_STATUS).json({ "status": 1, "message": "Payment has been done successfully" });

                } catch (err) {

                    console.log("transaction error ==> ",err);

                    // Set transaction status to failed
                    let updated_transaction = await transaction_helper.update_transaction_by_id(transaction_resp.transaction._id, { "status": "failed" });
                    res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Transaction has been failed" });
                }
            }
        } else {
            console.log("resp = ",transaction_resp);
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while doing transaction" })
        }

    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

module.exports = router;