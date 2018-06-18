var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var Transaction = require("./../models/Transaction");
var transaction_helper = {};

/*
 * Insert transaction
 * @developed by "ar"
 */
transaction_helper.insert_transaction = async (transaction_object) => {
    let transaction = new Transaction(transaction_object)
    try {
        let transaction_data = await transaction.save();
        return { "status": 1, "message": "Transaction has been inserted", "transaction": transaction_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting transaction", "error": err };
    }
};

transaction_helper.update_transaction_by_id = async (transaction_id, obj) => {
    try {
        let transaction = await Transaction.findOneAndUpdate({ "_id": new ObjectId(transaction_id) }, obj);
        if (!transaction) {
            return { "status": 2, "message": "Transaction has not updated" };
        } else {
            return { "status": 1, "message": "Transaction has been updated", "transaction": transaction };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while updating transaction", "error": err }
    }
};

transaction_helper.get_transaction_by_promoter = async (promoter_id, filter, page_no, page_size) => {
    let aggregate = [
        {
            "$match": {
                "promoter_id": new ObjectId(promoter_id)
            }
        },
        {
            "$unwind": "$cart_items"
        },
        {
            "$match":{
                "cart_items.status":"paid"
            }
        },
        {
            "$lookup": {
                "from": "campaign_applied",
                "localField": "cart_items.applied_post_id",
                "foreignField": "_id",
                "as": "campaign_post"
            }
        },
        {
            "$unwind": "$campaign_post"
        }
    ];

    if (filter) {
        aggregate.push({ "$match": filter });
    }

    aggregate.concat([
        {
            "$group": {
                "_id": null,
                "total": { "$sum": 1 },
                'results': {
                    "$push": {
                        "results._id":"$results._id",
                        "results.campaign_description":"$results.campaign_post.desription",
                        "results.image":"$results.campaign_post.image",
                        "results.price":"$results.cart_items.price",
                        "results.gst":"$results.cart_items.gst",
                        "results.brand":"$results.company"
                    }
                }
            }
        }
    ]);

    if (page_size && page_no) {
        aggregate.push({
            "$project": {
                "total": 1,
                'transaction': { "$slice": ["$results", page_size * (page_no - 1), page_size] }
            }
        });
    } else {
        aggregate.push({
            "$project": {
                "total": 1,
                'transaction': "$results"
            }
        });
    }

    let transactions = await Transaction.aggregate(aggregate);

    if (transactions && transactions[0] && transactions[0].transaction && transactions[0].transaction.length > 0) {
        return { "status": 1, "message": "Transaction found", "results": transactions[0] };
    } else {
        console.log("transactions", transactions);
        return { "status": 0, "message": "No transaction found" };
    }
};

transaction_helper.get_transaction_by_applied_post_id = async (applied_post_id) => {
    let transaction = await Transaction.aggregate([
        {
            "$unwind":"$cart_items"
        },
        {
            "$match":{
                "cart_items.applied_post_id":new ObjectId(applied_post_id)
            }
        }
    ]);

    if(transaction && transaction[0]){
        return {"status":1,"message":"Post found in transaction","transaction":transaction[0]}
    }
};

transaction_helper.update_status_of_cart_item = async(cart_item_id,status) => {
    let update_resp = await Transaction.findOneAndUpdate({
        "cart_items._id":new ObjectId(cart_item_id)
    }, {
        "$set":{"cart_items.$.status":status}
    });
    return {"status":1,"message":"Record has been updated"};
}

module.exports = transaction_helper;