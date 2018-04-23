var mongoose = require('mongoose');

var Cart = require("./../models/Cart");
var cart_helper = {};

var ObjectId = mongoose.Types.ObjectId;

/*
 * insert_cart_item is used to insert cart item
 * 
 * @param   cart_object     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting cart, with error
 *          status  1 - If cart inserted, with inserted cart's document and appropriate message
 * 
 * @developed by "ar"
 */
cart_helper.insert_cart_item = async (cart_object) => {
    let cart = new Cart(cart_object)
    try {
        let cart_data = await cart.save();
        return { "status": 1, "message": "Cart item has been added", "cart": cart_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while adding cart item", "error": err };
    }
};


cart_helper.insert_multiple_cart_item = async (cart_item_array) => {
    try {
        let cart_item_data = await Cart.insertMany(cart_item_array);
        return { "status": 1, "message": "Cart item has been added", "cart_items": cart_item_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting multiple cart item", "error": err };
    }
};

module.exports = cart_helper;