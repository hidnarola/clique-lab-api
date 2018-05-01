var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

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

cart_helper.view_cart_details_by_promoter = async (promoter_id) => {
    try {
        var cart_items = await Cart.aggregate([
            {
                "$match": {
                    "promoter_id": new ObjectId(promoter_id)
                }
            },
            {
                "$lookup": {
                    from: "campaign",
                    localField: "campaign_id",
                    foreignField: "_id",
                    as: "campaign"
                }
            },
            {
                "$unwind": "$campaign"
            },
            {
                "$lookup": {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                "$unwind": "$user"
            },
            {
                "$group": {
                    "_id": null,
                    "sub_total": { $sum: "$campaign.price" },
                    "cart_items": { "$push": "$$ROOT" }
                }
            }
        ]);
        if (cart_items && cart_items[0]) {
            cart_items[0].gst = await (cart_items[0].sub_total * 10) / 100;
            cart_items[0].total = await cart_items[0].sub_total + cart_items[0].gst;
            return { "status": 1, "message": "Cart items found", "results": cart_items[0] }
        } else {
            return { "status": 2, "message": "No item available in cart" }
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting multiple cart item", "error": err };
    }
};

cart_helper.clear_cart_by_promoter = async (promoter_id) => {
    try{
        
    } catch(err){
        return { "status": 0, "message": "Error occured while clearing cart", "error": err };
    }
};

module.exports = cart_helper;