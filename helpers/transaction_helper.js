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

module.exports = transaction_helper;