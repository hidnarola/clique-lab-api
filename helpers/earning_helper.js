var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var User = require("./../models/User");
var Earning = require("./../models/User_earnings");
var earning_helper = {};

var ObjectId = mongoose.Types.ObjectId;

/*
 * Insert earning
 * @developed by "ar"
 */
earning_helper.insert_user_earning = async (earning_object) => {
    let earning = new Earning(earning_object)
    try {
        let earning_data = await earning.save();
        return { "status": 1, "message": "Transaction has been recorded", "transaction": earning_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting earning", "error": err };
    }
};

/**
 * 
 */
earning_helper.get_earning_by_user = async (user_id, page_no, page_size) => {
    try {
        let aggregate = [
            {
                "$match": {
                    "user_id": new ObjectId(user_id)
                }
            },
            {
                "$lookup": {
                    "from": "campaign",
                    "localField": "campaign_id",
                    "foreignField": "_id",
                    "as": "campaign"
                }
            },
            {
                "$unwind": "$campaign"
            },
            {
                "$lookup": {
                    "from": "promoters",
                    "localField": "campaign.promoter_id",
                    "foreignField": "_id",
                    "as": "brand"
                }
            },
            {
                "$unwind": "$brand"
            },
            {
                "$lookup": {
                    "from": "campaign_applied",
                    "localField": "campaign.campaign_id",
                    "foreignField": "camapign_id",
                    "as": "applied_post"
                }
            },
            {
                "$unwind": "$applied_post"
            },
            {
                "$redact": {
                    "$cond": [
                        {
                            "$and": [
                                { "$eq": ["$applied_post.user_id", "$user_id"] },
                                { "$eq": ["$applied_post.campaign_id", "$campaign_id"] }
                            ]
                        },
                        "$$KEEP",
                        "$$PRUNE"
                    ]
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "campaign_id": 1,
                    "price": 1,
                    "created_at": 1,
                    "camapign_name": "$campaign.name",
                    "campaign_image": "$campaign.cover_image",
                    "social_platform": "$campaign.social_media_platform",
                    "brand": "$brand.company",
                    "post_description": "$applied_post.desription",
                    "post_image": "$applied_post.image"
                }
            },
            {
                "$sort":{"created_at":-1}
            }
        ];

        aggregate.push({
            "$group": {
                "_id": null,
                "total": { "$sum": 1 },
                'results': { "$push": '$$ROOT' }
            }
        });

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
        let earnings = await Earning.aggregate(aggregate);
        if (earnings && earnings[0] && earnings[0].total > 0) {
            return { "status": 1, "message": "Transaction found", "result": earnings[0] };
        } else {
            return { "status": 0, "message": "Transaction not found" };
        }
        return earnings;
    } catch (err) {
        return { "status": 0, "message": "Error occured while fetching transaction", "error": err };
    }
};

earning_helper.get_earning_of_users_by_fb_ids = async (fb_ids, page_no, page_size) => {
    try {
        let aggregate = [
            {
                "$match": {
                    "facebook.id": { "$in": fb_ids }
                }
            },
            {
                "$lookup": {
                    "from": "user_earnings",
                    "localField": "_id",
                    "foreignField": "user_id",
                    "as": "earning"
                }
            },
            {
                "$unwind": "$earning"
            },
            {
                "$group": {
                    "_id": "$_id",
                    "image": { "$first": "$image" },
                    "name": { "$first": "$name" },
                    "username":{ "$first": "$username" },
                    "total_earnings": { "$sum": "$earning.price" }
                }
            },
            {
                "$sort": { "total_earnings": -1 }
            },
            {
                "$group": {
                    "_id": null,
                    "total": { "$sum": 1 },
                    'results': { "$push": '$$ROOT' }
                }
            }
        ];

        if (page_size && page_no) {
            aggregate.push({
                "$project": {
                    "total": 1,
                    'users': { "$slice": ["$results", page_size * (page_no - 1), page_size] }
                }
            });
        } else {
            aggregate.push({
                "$project": {
                    "total": 1,
                    'users': "$results"
                }
            });
        }

        let earning = await User.aggregate(aggregate);

        if (earning && earning[0] && earning[0].users.length > 0) {
            let rank = 0;
            earning[0].users = earning[0].users.map((user) => {
                user.rank = rank = rank + 1;
                return user;
            });
            return { "status": 1, "message": "Record found", "ranking": earning[0] }
        } else {
            return { "status": 2, "message": "No user found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while fetching transaction", "error": err };
    }
};

earning_helper.get_earning_of_users = async (page_no, page_size) => {
    try {
        let aggregate = [
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user"
                }
            },
            {
                "$unwind": "$user"
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "image": { "$first": "$user.image" },
                    "name": { "$first": "$user.name" },
                    "username":{ "$first": "$user.username" },
                    "total_earnings": { "$sum": "$price" }
                }
            },
            {
                "$sort": { "total_earnings": -1 }
            },
            {
                "$group": {
                    "_id": null,
                    "total": { "$sum": 1 },
                    'results': { "$push": '$$ROOT' }
                }
            }
        ];

        if (page_size && page_no) {
            aggregate.push({
                "$project": {
                    "total": 1,
                    'users': { "$slice": ["$results", page_size * (page_no - 1), page_size] }
                }
            });
        } else {
            aggregate.push({
                "$project": {
                    "total": 1,
                    'users': "$results"
                }
            });
        }

        console.log("aggregate ==> ",JSON.stringify(aggregate));
        let earning = await Earning.aggregate(aggregate);
        console.log("Earning ==> ",earning);

        if (earning && earning[0] && earning[0].users.length > 0) {
            let rank = 0;
            earning[0].users = earning[0].users.map((user) => {
                user.rank = rank = rank + 1;
                return user;
            });
            return { "status": 1, "message": "Record found", "ranking": earning[0] }
        } else {
            return { "status": 2, "message": "No user found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while fetching transaction", "error": err };
    }
};

module.exports = earning_helper;