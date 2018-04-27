var express = require("express");
var router = express.Router();

var config = require('./../../config');
var cart_helper = require('./../../helpers/cart_helper');

/**
 * Get cart product
 * /promoter/cart
 * Developed by "ar"
 */
router.get('/', async (req, res) => {
    var cart_item_resp = await cart_helper.view_cart_details_by_promoter(req.userInfo.id);
    if(cart_item_resp.status === 0){
        res.status(config.INTERNAL_SERVER_ERROR).json({"status":0,"message":"Error occured while finding cart details","error":cart_item_resp.error});
    } else if(cart_item_resp.status === 2){
        res.status(config.BAD_REQUEST).json({"status":0,"message":"No cart item available"});
    } else {
        res.status(config.OK_STATUS).json({"status":1,"message":"Cart items found","cart_items":cart_item_resp.cart_items});
    }
});

/**
 * Purchase Item available in cart
 * /promoter/cart/purchase
 * Developed by "ar"
 */
router.post('/purchase',async(req,res)=>{
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
        'credit_card':{
            notEmpty: true,
            errorMessage: "Credit card is required"
        }
    };
    req.checkBody(schema);
    const errors = req.validationErrors();
    if (!errors) {
        
    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
})

module.exports = router;                        