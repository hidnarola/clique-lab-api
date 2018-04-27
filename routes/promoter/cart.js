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
    try {
        var cart_item_resp = await cart_helper.view_cart_details_by_promoter(req.userInfo.id);
        res.status(config.OK_STATUS).json(cart_item_resp);
    } catch (err) {
        res.status(config.INTERNAL_SERVER_ERROR).json({"status":0,"message":"Error occured while finding cart details","error":err});
    }
});

module.exports = router;                        