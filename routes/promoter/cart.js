var express = require("express");
var router = express.Router();

var config = require('./../../config');
var cart_helper = require('./../../helpers/cart_helper');
var campaign_helper = require('./../../helpers/campaign_helper');
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
        // 'company': {
        //     notEmpty: true,
        //     errorMessage: "Company name is required"
        // },
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
        // 'address_line_2': {
        //     notEmpty: true,
        //     errorMessage: "Address line 2 is required"
        // },
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

        // get user's stripe account
        let promoter_resp = await promoter_helper.get_promoter_by_id(req.userInfo.id);
        if (promoter_resp.status === 1 && promoter_resp.promoter && promoter_resp.promoter.stripe_customer_id) {
            try {

                // Fetch currently active cart
                var active_cart = await cart_helper.view_cart_details_by_promoter(req.userInfo.id);

                console.log("Iterating cart item");
                // Create charge for each post
                let cart_items = await active_cart.results.cart_items.map(async (item) => {
                    var id = "";
                    var type = "";
                    let obj = {
                        "promoter_id": item.promoter_id,
                        "status": "pending"
                    };

                    if (item.inspired_post_id) {
                        id = obj.inspired_post_id = item.inspired_post_id;
                        type = "inspired_post";
                        // obj.price = item.campaign.price;
                    }

                    if (item.applied_post_id) {
                        id = obj.applied_post_id = item.applied_post_id;
                        type = "applied_post";
                    }

                    if (item.campaign_id) {
                        obj.campaign_id = item.campaign_id;
                        obj.price = item.campaign.price;
                        obj.gst = parseFloat(item.campaign.price * 10 / 100).toFixed(2);
                    }

                    console.log("creating token : ",id, " of ",type);
                    var token = await stripe.tokens.create({
                        card: req.body.credit_card,
                        customer: promoter_resp.promoter.stripe_customer_id
                    });

                    console.log("token ==> ",token.id);

                    console.log("creating charge");
                    // Create charge with additional 10% GST
                    let charge = await stripe.charges.create({
                        "amount": (obj.price + obj.gst) * 100, // 100 means $1
                        "currency": "aud",
                        "capture": false,
                        "source":token.id,
                        "customer": promoter_resp.promoter.stripe_customer_id,
                        "statement_descriptor": "Clique purchase", // length must be 22 character max.
                        "metadata": {
                            "CHARGETYPE": "Authorization ONLY",
                            "id": id,
                            "type": type,
                            "price": obj.price,
                            "GST": obj.gst,
                            "promoterID": req.userInfo.id
                        }
                    });
                    console.log("charge id => ",charge.id);

                    obj.stripe_charge_id = charge.id;

                    return obj;
                });

                console.log("Inserting transaction : ",cart_items);
                // Add transaction
                let transaction_obj = {
                    "promoter_id": req.userInfo.id,
                    "name": req.body.name,
                    "email": req.body.email,
                    "abn": req.body.abn,
                    "country": req.body.country,
                    "address_line1": req.body.address_line_1,
                    // "company":req.body.company,
                    "city": req.body.city,
                    "state": req.body.state,
                    "post_code": req.body.post_code,
                    "credit_card": req.body.credit_card,
                    "total_amount": active_cart.results.total,
                    "cart_items": cart_items
                };

                if (req.body.company) {
                    transaction_obj.company = req.body.company;
                }

                if (req.body.address_line_2) {
                    transaction_obj.address_line2 = req.body.address_line_2;
                }

                let transaction_resp = await transaction_helper.insert_transaction(transaction_obj);
                console.log("Transaction resp ==> ",transaction_resp);

                if (transaction_resp.status === 1) {

                    console.log("Updating status of campaign user");
                    // mark status as purchased for campaign_user
                    active_cart.results.cart_items.forEach(async (cart_item) => {
                        if (cart_item.campaign_id) {
                            await campaign_helper.update_campaign_user(cart_item.user._id, cart_item.campaign_id, { "is_purchase": true });
                        }
                    });

                    // Clear active cart here
                    await cart_helper.clear_cart_by_promoter(req.userInfo.id);

                    res.status(config.OK_STATUS).json({ "status": 1, "message": "Payment has been done successfully" });

                } else {
                    console.log("resp = ", transaction_resp);
                    res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while doing transaction" })
                }

            } catch (err) {
                console.log("transaction error ==> ", err);
                res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Transaction has been failed" });
            }
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "User is not having any stripe account" });
        }

    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

/**
 * Delete cart item
 * /promoter/cart/:cart_item_id
 */
router.delete('/:cart_item_id', async (req, res) => {
    var del_resp = await cart_helper.remove_cart_item(req.params.cart_item_id);
    if (del_resp.status === 0) {
        console.log("error => ", del_resp);
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while deleting cart item", "error": del_resp.error });
    } else if (del_resp.status === 2) {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Can't remove cart item" });
    } else {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Cart item has been removed" });
    }
});

module.exports = router;