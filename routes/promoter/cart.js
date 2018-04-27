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

module.exports = router;                        