var mongoose = require('mongoose');

var Campaign_post = require("./../models/Campaign_post");
var Campaign = require("./../models/Campaign");
var Transaction = require("./../models/Transaction");

var ObjectId = mongoose.Types.ObjectId;
var campaign_post_helper = {};

/*
 * insert_campaign is used to insert into campaign collection
 * 
 * @param   campaign_object     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting campaign, with error
 *          status  1 - If campaign inserted, with inserted faculty's document and appropriate message
 * 
 * @developed by "mm"
 */
campaign_post_helper.insert_campaign_post = async (obj) => {

    let campaign = new Campaign_post(obj);
    try {
        let campaign_data = await campaign.save();
        return { "status": 1, "message": "Campaign post inserted", "campaign": campaign_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting campaign post", "error": err };
    }
};


/**
 * return count of total purchased post by promoter
 * 
 * @param {*} promoter_id 
 * @param {*} filter 
 * 
 * Developed by "ar"
 */
campaign_post_helper.count_purchase_post_by_promoter = async (promoter_id, filter) => {
    var aggregate = [
        {
            "$match": { "promoter_id": new ObjectId(promoter_id) }
        },
        {
            $lookup: {
                from: "campaign_user",
                localField: "_id",
                foreignField: "campaign_id",
                as: "campaign_user"
            }
        },
        {
            $unwind: "$campaign_user"
        },
        {
            "$match": {
                "campaign_user.is_purchase": true
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "campaign_user.user_id",
                "foreignField": "_id",
                "as": "user"
            }
        },
        {
            $unwind: "$user"
        }
    ];

    if (filter) {
        aggregate.push({ "$match": filter });
    }

    aggregate.push({
        "$group": {
            "_id": null,
            "purchase_post": { "$sum": 1 },
        }
    });

    let result = await Campaign.aggregate(aggregate);
    if (result && result[0] && result[0].purchase_post) {
        return result[0].purchase_post;
    } else {
        return 0;
    }
};

campaign_post_helper.total_spent_by_promoter = async (promoter_id, filter) => {

    var total_spent = [
        {
            "$match": {
                "promoter_id": new ObjectId(promoter_id),
                "status": "paid"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "cart_items.user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },

    ];
    if (filter) {
        total_spent.push({ "$match": filter });
    }
    total_spent.push({
        $group: {
            "_id": null,
            "total": { $sum: "$total_amount" }
        }
    });

    var result = await Transaction.aggregate(total_spent);
    if (result && result[0] && result[0].total) {
        return result[0].total;
    } else {
        return 0;
    }
};

campaign_post_helper.get_applied_post_by_campaign = async (campaign_id, page_no, page_size, filter, sort) => {
    try {
        var aggregate = [
            {
                "$match": { "_id": new ObjectId(campaign_id) }
            },
            {
                "$lookup": {
                    "from": "campaign_user",
                    "localField": "_id",
                    "foreignField": "campaign_id",
                    "as": "campaign_user"
                }
            },
            {
                "$unwind": "$campaign_user"
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "campaign_user.user_id",
                    "foreignField": "_id",
                    "as": "user"
                }
            },
            {
                "$unwind": "$user"
            },
            {
                "$project": {
                    "_id": 1,
                    "campaign_user": { $mergeObjects: ["$campaign_user", "$user"] }
                }
            }
        ];

        if (filter) {
            aggregate.push({ "$match": filter });
        }
        if (sort) {
            aggregate.push({ "$sort": sort });
        }

        aggregate.push(
            {
                "$group": {
                    "_id": "$_id",
                    "campaign_user": { $push: "$campaign_user" }
                }
            });

        if (page_size && page_no) {
            aggregate.push({
                "$project": {
                    "_id": "$_id",
                    "total": { "$size": "$campaign_user" },
                    "users": { "$slice": ["$campaign_user", page_size * (page_no - 1), page_size] }
                }
            });
        } else {
            aggregate.push({
                "$project": {
                    "_id": "$_id",
                    "total": { "$size": "$campaign_user" },
                    "users": "$campaign_user"
                }
            });
        }

        console.log("aggregate : ", JSON.stringify(aggregate));

        var campaign = await Campaign.aggregate(aggregate);

        if (campaign && campaign[0]) {
            return { "status": 1, "message": "Campaign found", "campaign": campaign[0] };
        } else {
            return { "status": 2, "message": "No campaign found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
};

module.exports = campaign_post_helper;
