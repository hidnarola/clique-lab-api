var mongoose = require('mongoose');
var moment = require('moment');
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
            "$match": {
                "cart_items.status": "paid"
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

    aggregate = aggregate.concat([
        {
            "$group": {
                "_id": null,
                "total": { "$sum": 1 },
                'results': {
                    "$push": {
                        "_id": "$_id",
                        "campaign_description": "$campaign_post.desription",
                        "image": "$campaign_post.image",
                        "price": "$cart_items.price",
                        "gst": "$cart_items.gst",
                        "brand": "$company"
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

    console.log("Aggregate ==> ", JSON.stringify(aggregate));
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
            "$unwind": "$cart_items"
        },
        {
            "$match": {
                "cart_items.applied_post_id": new ObjectId(applied_post_id)
            }
        }
    ]);

    if (transaction && transaction[0]) {
        return { "status": 1, "message": "Post found in transaction", "transaction": transaction[0] }
    } else {
        return { "status": 0, "message": "No transaction found", "transaction": transaction[0] }
    }
};

transaction_helper.update_status_of_cart_item = async (cart_item_id, status) => {
    let update_resp = await Transaction.findOneAndUpdate({
        "cart_items._id": new ObjectId(cart_item_id)
    }, {
            "$set": { "cart_items.$.status": status }
        });
    return { "status": 1, "message": "Record has been updated" };
}

transaction_helper.get_all_transaction = async (filter, sort, page_no, page_size) => {

    let transactions = await Transaction.aggregate([
        {
            "$unwind":"$cart_items"
        },
        {
            "$facet":{
                "applied_post":[
                    {
                        "$lookup": {
                            "from": "campaign_applied",
                            "localField": "cart_items.applied_post_id",
                            "foreignField": "_id",
                            "as": "post"
                        }
                    },
                    {
                        "$unwind":"$post"
                    },
                    {
                        "$project":{
                            "_id":1,
                            "date":"$created_at",
                            "campaign_description":"$post.desription",
                            "promoter_id":"$promoter_id",
                            "user_id":"$post.user_id",
                            "price":"$cart_items.price",
                            "gst":"$cart_items.gst",
                            "status":"$cart_items.status",
                            "post_id":"$post._id",
                            "post_type":"applied_post"
                        }
                    }
                ],
                "inspired_post":[
                    {
                        "$lookup": {
                            "from": "inspired_brands",
                            "localField": "cart_items.inspired_post_id",
                            "foreignField": "_id",
                            "as": "post"
                        }
                    },
                    {
                        "$unwind":"$post"
                    },
                    {
                        "$project":{
                            "_id":1,
                            "date":"$created_at",
                            "campaign_description":"$post.text",
                            "promoter_id":"$promoter_id",
                            "user_id":"$post.user_id",
                            "price":"$cart_items.price",
                            "gst":"$cart_items.gst",
                            "status":"$cart_items.status",
                            "post_id":"$post._id",
                            "post_type":"inspired_post"
                        }
                    }
                ],
            }
        },
        {
            "$project":{
                "post":{
                    "$concatArrays":["$applied_post","$inspired_post"]
                }
            }
        },
        {
            "$unwind":"$post"
        },
        {
            "$lookup":{
                "from":"promoters",
                "foreignField":"_id",
                "localField":"post.promoter_id",
                "as":"promoter"
            }
        },
        {
            "$unwind":"$promoter"
        },
        {
            "$lookup":{
                "from":"users",
                "foreignField":"_id",
                "localField":"post.user_id",
                "as":"user"
            }
        },
        {
            "$unwind":"$user"
        },
        {
            "$project":{
                "_id":"$post._id",
                "date":"$post.date",
                "campaign_description":"$post.campaign_description",
                "brand":"$promoter.company",
                "promoter":"$promoter.full_name",
                "user":"$user.name",
                "price":"$post.price",
                "gst":"$post.gst",
                "status":"$post.status",
                "post_id":"$post.post_id",
                "post_type":"$post.post_type"
            }
        },
        {
            "$match": filter
        },
        {
            "$sort":sort
        },
        {
            "$group":{
                "_id":null,
                "total":{"$sum":1},
                "post":{"$push":"$$ROOT"}
            }
        },
        {
            "$project":{
                "_id":1,
                "total":1,
                "post":{ "$slice": ["$post", page_size * (page_no - 1), page_size] }
            }
        }
    ]);

    if (transactions && transactions[0] && transactions[0].post && transactions[0].post.length > 0) {

        transactions[0].post = transactions[0].post.map((transaction) => {
            if (transaction.status != "paid") {
                if (moment().diff(moment(transaction.date), 'days') >= 3) {
                    transaction.status = "Refunded";
                } else {
                    transaction.status = "In Progress";
                }
            } else {
                transaction.status = "Paid";
            }
            return transaction;
        });

        return { "status": 1, "message": "Transaction found", "results": transactions[0] };
    } else {
        console.log("transactions", transactions);
        return { "status": 0, "message": "No transaction found" };
    }
};

module.exports = transaction_helper;