var express = require("express");
var router = express.Router();

var config = require('./../../config');
var cart_helper = require('./../../helpers/cart_helper');
var user_helper = require('./../../helpers/user_helper');
var push_notification_helper = require('./../../helpers/push_notification_helper');
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
 * Get cart count
 * /promoter/cart/count
 * Developed by "ar"
 */
router.get('/count', async (req, res) => {
    var cart_item_resp = await cart_helper.get_total_cart_items(req.userInfo.id);
    if (cart_item_resp.status === 0) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while fetching total cart items", "error": cart_item_resp.error });
    } else {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Cart items count found", "count": cart_item_resp.count });
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
        'company': {
            notEmpty: true,
            errorMessage: "Company name is required"
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
                let cart_items = active_cart.results.cart_items.map(async (item) => {

                    console.log("Item ==> ", item);

                    var id = "";
                    var type = "";
                    let obj = {
                        "promoter_id": item.promoter_id,
                        "status": "pending"
                    };

                    if (item.inspired_post_id) {
                        id = obj.inspired_post_id = item.inspired_post_id;
                        type = "inspired_post";
                        obj.price = item.inspired_post.price;
                        obj.gst = parseFloat(item.inspired_post.price * 10 / 100).toFixed(2);
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

                    // console.log("token ==> ",token.id);
                    console.log("Object ==> ", obj);
                    console.log("creating charge of ", (obj.price * 1 + obj.gst * 1) * 100);
                    // Create charge with additional 10% GST
                    let charge = await stripe.charges.create({
                        "amount": parseInt((obj.price * 1 + obj.gst * 1) * 100), // 100 means $1
                        "currency": "aud",
                        "capture": false,
                        "source": req.body.credit_card,
                        "customer": promoter_resp.promoter.stripe_customer_id,
                        "statement_descriptor": "Clique purchase", // length must be 22 character max.
                        "metadata": {
                            "CHARGETYPE": "Authorization ONLY",
                            "id": id.toString(),
                            "type": type,
                            "price": obj.price,
                            "GST": obj.gst,
                            "promoterID": req.userInfo.id
                        }
                    });
                    console.log("charge id => ", charge.id);

                    obj.stripe_charge_id = charge.id;

                    return obj;
                });

                cart_items = await Promise.all(cart_items);

                console.log("Inserting transaction : ", cart_items);
                // Add transaction
                let transaction_obj = {
                    "promoter_id": req.userInfo.id,
                    "name": req.body.name.trim(),
                    "email": req.body.email,
                    "abn": req.body.abn,
                    "country": req.body.country,
                    "address_line1": req.body.address_line_1.trim(),
                    // "company":req.body.company.trim(),
                    "city": req.body.city.trim(),
                    "state": req.body.state,
                    "post_code": req.body.post_code.trim(),
                    "credit_card": req.body.credit_card,
                    "total_amount": active_cart.results.total,
                    "cart_items": cart_items
                };

                if (req.body.company) {
                    transaction_obj.company = req.body.company;
                }

                if (req.body.address_line_2) {
                    transaction_obj.address_line2 = req.body.address_line_2.trim();
                }

                let transaction_resp = await transaction_helper.insert_transaction(transaction_obj);
                console.log("Transaction resp ==> ", transaction_resp);

                if (transaction_resp.status === 1) {

                    console.log("Updating status of campaign user");
                    // mark status as purchased for campaign_user
                    active_cart.results.cart_items.forEach(async (cart_item) => {
                        if (cart_item.user._id) {
                            // Send push notification to user
                            let user_res = await user_helper.get_user_by_id(cart_item.user._id);
                            if (user_res.state === 1 && user_res.User) {

                                let image_url = "";
                                if (cart_item.campaign_id) {
                                    let campaign_resp = await campaign_helper.get_campaign_by_id(cart_item.campaign_id);
                                    image_url = campaign_resp.Campaign.cover_image;
                                } else {
                                    image_url = cart_item.inspired_post.image;
                                }

                                // Check status and enter notification into DB
                                if (user_res.User.notification_settings && user_res.User.notification_settings.got_paid) {

                                    var notification_obj = {
                                        "user_id": user_res.User._id,
                                        "text": "You applied post has been approved.",
                                        "image_url": image_url,
                                        "is_read": false,
                                        "type": "got-paid"
                                    };
                                    let notification_resp = await notification_helper.insert_notification(notification_obj);
                                }

                                if (user_res.User.device_token && user_res.User.device_token.length > 0) {
                                    if (user_res.User.notification_settings && user_res.User.notification_settings.push_got_approved) {
                                        let notification_resp = user_res.User.device_token.forEach(async (token) => {
                                            if (token.platform && token.token) {
                                                if (token.platform == "ios") {
                                                    await push_notification_helper.sendToIOS(token.token, {
                                                        "message": "You applied post has been approved."
                                                    });
                                                } else if (token.platform == "android") {
                                                    await push_notification_helper.sendToAndroid(token.token, {
                                                        "message": "You applied post has been approved."
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }

                            }
                        }

                        if (cart_item.campaign_id) {
                            await campaign_helper.update_campaign_user(cart_item.user._id, cart_item.campaign_id, { "is_purchase": true, purchased_at: Date.now() });
                        } else if(cart_item.inspired_post){
                            await campaign_helper.update_campaign_user(cart_item.inspired_post_id, { "is_purchase": true, purchased_at: Date.now() });
                        }
                    });

                    console.log("clear existing cart");
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