var mongoose = require('mongoose');
var moment = require('moment');
var _ = require('underscore');

var Campaign_Applied = require("./../models/Campaign_applied");
var Campaign_User = require("./../models/Campaign_user");
var transaction = require("./../models/Transaction");
var Promoter = require("./../models/Promoter");
var campaign_user = require("./../models/Promoter");
var Campaign = require("./../models/Campaign");
var Campaign_user = require("./../models/Campaign_user");
var campaign_post = require("./../models/Campaign_post");

var campaign_post_helper = require('./campaign_post_helper');

var ObjectId = mongoose.Types.ObjectId;
var FB = require('fb');



var campaign_helper = {};

/*
 * get_campaign_by_id is used to fetch all campaign data
 * 
 * @params id string user_id
 * 
 * @return  status 0 - If any internal error occured while fetching campaign data, with error
 *          status 1 - If campaign data found, with campaign object
 *          status 2 - If campaign not found, with appropriate message
 */
campaign_helper.get_campaign_by_user_id = async (id, filter, page_no, page_size) => {
    try {

        var campaigns = await Campaign.aggregate([
            {
                $lookup: {
                    from: "campaign_user",
                    localField: "_id",
                    foreignField: "campaign_id",
                    as: "approved_campaign"
                }
            },
            {
                $unwind: "$approved_campaign"
            },
            {
                $match: {
                    "approved_campaign.user_id": { "$eq": new ObjectId(id) },
                    "status": true,
                    //"social_media_platform": filter
                }
            },
            {
                $project:
                    {
                        social_media_platform: 1,
                        hash_tag: 1, at_tag: 1,
                        privacy: 1, media_format: 1,
                        mood_board_images: 1,
                        name: 1,
                        start_date: 1,
                        end_date: 1,
                        call_to_action: 1,
                        location: 1,
                        price: 1,
                        currency: 1,
                        promoter_id: 1,
                        description: 1,
                        cover_image: 1
                    }
            },
            {
                $skip: page_no > 0 ? ((page_no - 1) * page_size) : 0
            },
            {
                $limit: page_size

            }
            /*{
                $sort: {price : sort} 
            },*/

        ]
        )

        console.log("campaign = ", campaigns);
        if (campaigns && campaigns.length > 0) {
            return { "status": 1, "message": "campaign found", "campaign": campaigns };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {

        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}

/*
 * campaign_helper is used to fetch all capaign data
 * 
 * @return  status 0 - If any internal error occured while fetching campaign data, with error
 *          status 1 - If campaign data found, with campaign object
 *          status 2 - If campaign not found, with appropriate message
 */
campaign_helper.get_all_campaign = async (filter, redact, sort, page_no, page_size) => {
    try {
        var aggregate = [];
        if (filter) {
            aggregate.push({ "$match": filter });
        }

        if (redact) {
            aggregate.push({ "$redact": { "$cond": { "if": redact, "then": "$$KEEP", "else": "$$PRUNE" } } });
        }

        if (sort) {
            aggregate.push({ "$sort": sort });
        }

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
                    'campaign': { "$slice": ["$results", page_size * (page_no - 1), page_size] }
                }
            });
        } else {
            aggregate.push({
                "$project": {
                    "total": 1,
                    'campaign': "$results"
                }
            });
        }

        var campaign = await Campaign.aggregate(aggregate);

        if (campaign && campaign[0] && campaign[0].campaign.length > 0) {
            return { "status": 1, "message": "campaign found", "Campaigns": campaign };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}

/**
 * get all campaign of promoter
 * Developed by "ar"
 */
campaign_helper.get_all_campaign_of_promoter = async (promoter_id) => {
    try {
        var aggregate = [{
            "$match": {
                "promoter_id": new ObjectId(promoter_id)
            }
        }];

        var campaign = await Campaign.aggregate(aggregate);
        console.log("Campaign = ", campaign);

        if (campaign) {
            return { "status": 1, "message": "campaign found", "campaigns": campaign };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}

/*
 * campaign_helper is used to fetch  capaign data by id
 * 
 * @return  status 0 - If any internal error occured while fetching campaign data, with error
 *          status 1 - If campaign data found, with campaign object
 *          status 2 - If campaign not found, with appropriate message
 */

campaign_helper.get_campaign_by_id = async (campaign_id, likes) => {

    try {
        var campaign = await Campaign.findOne({ _id: campaign_id }).lean();
        if (campaign) {
            return { "status": 1, "message": "campaign found", "Campaign": campaign, "likes": likes };

        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}


/*
 * insert_campaign_applied is used to insert into User collection
 * 
 * @param   campaign_object     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting campaign applied, with error
 *          status  1 - If campaign applied inserted, with inserted campaign applied's document and appropriate message
 * 
 * @developed by "mm"
 */
campaign_helper.insert_campaign_applied = async (campaign_object) => {
    let campaign = new Campaign_Applied(campaign_object)

    try {

        let campaign_data = await campaign.save();
        // let camapign_applied = await campaign_user.findOneAndUpdate({user_id : user_id,campaign_id:campaign_id},obj);
        return { "status": 1, "message": "Campaign inserted", "campaign": campaign_data };

    } catch (err) {

        return { "status": 0, "message": "Error occured while inserting Campaign Applied", "error": err };
    }
};


campaign_helper.update_campaign_by_user = async (user_id, campaign_id, obj) => {
    try {
        let user = await Campaign_User.findOneAndUpdate({ "user_id": new ObjectId(user_id), "campaign_id": new ObjectId(campaign_id) }, obj);

        if (!user) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated", "user": user };
        }
    } catch (err) {

        return { "status": 0, "message": "Error occured while updating user", "error": err }
    }
};

campaign_helper.update_campaign_by_id = async (campaign_id, obj) => {
    try {
        let campaign = await Campaign.findOneAndUpdate({ "_id": new ObjectId(campaign_id) }, obj);
        if (!campaign) {
            return { "status": 2, "message": "Campaign has not updated" };
        } else {
            return { "status": 1, "message": "Campaign has been updated", "campaign": campaign };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while updating campaign", "error": err }
    }
};

/*
 * insert_campaign_user is used to insert into Campaign_user collection
 * 
 * @param   campaign_user_object     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting campaign_user, with error
 *          status  1 - If campaign_user inserted, with inserted campaign_user's document and appropriate message
 * 
 * @developed by "ar"
 */
campaign_helper.insert_campaign_user = async (campaign_user_object) => {
    let campaign_user = new Campaign_User(campaign_user_object)
    try {
        let campaign_user_data = await campaign_user.save();
        return { "status": 1, "message": "User added in campaign", "campaign_user": campaign_user_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting into campaign_user", "error": err };
    }
};

campaign_helper.insert_multiple_campaign_user = async (campaign_user_array) => {
    try {
        let campaign_user_data = await Campaign_User.insertMany(campaign_user_array);
        return { "status": 1, "message": "User added in campaign", "campaign_user": campaign_user_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting into campaign_user", "error": err };
    }
};

/*
 * insert_campaign is used to insert into campaign collection
 * 
 * @param   campaign_object     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting campaign, with error
 *          status  1 - If campaign inserted, with inserted campaign's document and appropriate message
 * 
 * @developed by "ar"
 */
campaign_helper.insert_campaign = async (campaign_object) => {
    let campaign = new Campaign(campaign_object);
    try {
        let campaign_data = await campaign.save();
        return { "status": 1, "message": "Campaign inserted", "campaign": campaign_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting campaign", "error": err };
    }
};


/*
 * get_all_offered_campaign is used to fetch all campaign data
 * 
 * @return  status 0 - If any campaign error occured while fetching campaign data, with error
 *          status 1 - If campaign data found, with campaign object
 *          status 2 - If campaign not found, with appropriate message
 */
campaign_helper.get_all_offered_campaign = async (id, filter, sort, page_no, page_size) => {
    try {

        var user_offers = await Campaign_User.aggregate([
            {
                "$match":{
                    "user_id":new ObjectId(id),
                    "is_apply":false
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
                $project: {
                        social_media_platform: 1,
                        hash_tag: 1, at_tag: 1,
                        privacy: 1, media_format: 1,
                        mood_board_images: 1,
                        name: 1,
                        start_date: 1,
                        end_date: 1,
                        call_to_action: 1,
                        location: 1,
                        price: 1,
                        currency: 1,
                        promoter_id: 1,
                        description: 1,
                        cover_image: 1
                }
            },
            {
                $skip: page_no > 0 ? ((page_no - 1) * page_size) : 0
            },
            {
                $limit: page_size
            }
        ]);


        if (user_offers && user_offers.length > 0) {
            return { "status": 1, "message": "User's offer found", "campaign": user_offers };
        } else {
            return { "status": 2, "message": "No offer available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding user's offer", "error": err }
    }
}

campaign_helper.user_not_exist_campaign_for_promoter = async (user_id, promoter_id) => {
    try {
        var campaigns = await Campaign.aggregate([
            {
                "$match": { "promoter_id": new ObjectId(promoter_id) }
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
                "$match": { "campaign_user.user_id": { $ne: new ObjectId(user_id) } }
            }
        ]);

        if (campaigns && campaigns.length > 0) {
            return { "status": 1, "message": "campaign found", "campaigns": campaigns };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}

campaign_helper.get_active_campaign_by_promoter = async (promoter_id, page_no, page_size) => {
    try {
        var campaigns = await Campaign.aggregate([
            {
                "$match": {
                    "promoter_id": new ObjectId(promoter_id),
                    "start_date": { "$lt": new Date() },
                    "end_date": { "$gt": new Date() }
                }
            },
            { "$sort": { "created_at": -1 } },
            {
                "$skip": page_size * (page_no - 1)
            },
            {
                "$limit": page_size
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
                "$project": {
                    "_id": 1,
                    "name": 1,
                    "start_date": 1,
                    "end_date": 1,
                    "social_media_platform": 1,
                    "media_format": 1,
                    "location": 1,
                    "price": 1,
                    "currency": 1,
                    "description": 1,
                    "cover_image": 1,
                    "submissions": { "$size": "$campaign_user" },
                    // "remianing_days": { $subtract: ["$end_date",new Date()] }
                }
            },
            {
                "$group": {
                    "_id": null,
                    "total": { "$sum": 1 },
                    'campaigns': { "$push": '$$ROOT' }
                }
            },
        ]);

        if (campaigns && campaigns[0] && campaigns[0].campaigns.length > 0) {
            _.map(campaigns[0].campaigns, function (campaign) {
                campaign.remaining_days = moment(campaign.end_date).diff(moment(), 'days');
                return campaign;
            });
            return { "status": 1, "message": "campaign found", "campaigns": campaigns };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}

campaign_helper.get_future_campaign_by_promoter = async (promoter_id, page_no, page_size) => {
    try {
        var campaigns = await Campaign.aggregate([
            {
                "$match": {
                    "promoter_id": new ObjectId(promoter_id),
                    "start_date": { "$gt": new Date() }
                }
            },
            { "$sort": { "created_at": -1 } },
            {
                "$skip": page_size * (page_no - 1)
            },
            {
                "$limit": page_size
            },
            {
                "$project": {
                    "_id": 1,
                    "name": 1,
                    "start_date": 1,
                    "end_date": 1,
                    "social_media_platform": 1,
                    "media_format": 1,
                    "location": 1,
                    "price": 1,
                    "currency": 1,
                    "description": 1,
                    "cover_image": 1,
                    // "remianing_days": { $subtract: ["$end_date",new Date()] }
                }
            },
            {
                "$group": {
                    "_id": null,
                    "total": { "$sum": 1 },
                    'campaigns': { "$push": '$$ROOT' }
                }
            },
        ]);

        if (campaigns && campaigns[0] && campaigns[0].campaigns.length > 0) {
            _.map(campaigns[0].campaigns, function (campaign) {
                campaign.starts_in = moment(campaign.start_date).diff(moment(), 'days');
                return campaign;
            });
            return { "status": 1, "message": "campaign found", "campaigns": campaigns };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}

campaign_helper.get_past_campaign_by_promoter = async (promoter_id, page_no, page_size) => {
    try {
        var campaigns = await Campaign.aggregate([
            {
                "$match": {
                    "promoter_id": new ObjectId(promoter_id),
                    "end_date": { "$lt": new Date() }
                }
            },
            { "$sort": { "created_at": -1 } },
            {
                "$skip": page_size * (page_no - 1)
            },
            {
                "$limit": page_size
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
                "$project": {
                    "_id": 1,
                    "name": 1,
                    "start_date": 1,
                    "end_date": 1,
                    "social_media_platform": 1,
                    "media_format": 1,
                    "location": 1,
                    "price": 1,
                    "currency": 1,
                    "description": 1,
                    "cover_image": 1,
                    "submissions": { "$size": "$campaign_user" },
                    // "remianing_days": { $subtract: ["$end_date",new Date()] }
                }
            },
            {
                "$group": {
                    "_id": null,
                    "total": { "$sum": 1 },
                    'campaigns': { "$push": '$$ROOT' }
                }
            },
        ]);

        if (campaigns && campaigns[0] && campaigns[0].campaigns.length > 0) {
            return { "status": 1, "message": "campaign found", "campaigns": campaigns };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}

campaign_helper.delete_campaign_by_id = async (campaign_id) => {
    try {
        let resp = await Campaign.findOneAndRemove({ _id: campaign_id });
        if (!resp) {
            return { "status": 2, "message": "Campaign not found" };
        } else {
            // Delete all data related to campaign
            return { "status": 1, "message": "Campaign deleted", "resp": resp };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while deleting campaign", "error": err };
    }
}

campaign_helper.get_campaign_users_by_campaignid = async (campaign_id, page_no, page_size, filter, sort) => {
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
}



campaign_helper.get_purchased_post_by_promoter = async (promoter_id, page_no, page_size) => {
    try {
        var post = await Campaign.aggregate([
            {
                "$match": { "promoter_id": ObjectId("5ac730d4bd2d072f5072031d") },
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
            },
            {
                "$group": {
                    "_id": null,
                    "total": { "$sum": 1 },
                    'results': { "$push": '$$ROOT' }
                }
            },
            {
                "$project": {
                    "total": 1,
                    'results': { "$slice": ["$results", page_size * (page_no - 1), page_size] }
                }
            }
        ])


        if (post && post.length > 0) {
            return { "status": 1, "message": "post found", "post": post[0] };
        } else {
            return { "status": 2, "message": "No post available" };
        }
    } catch (err) {
        console.log("Error = ", err);
        return { "status": 0, "message": "Error occured while finding purchase post", "error": err }
    }
}

campaign_helper.get_promoters_by_social_media = async (promoter_id, filter) => {
    try {

        var aggregate = [{
            "$match": { "promoter_id": new ObjectId(promoter_id) }
        }];

        if (filter) {
            aggregate.push({ "$match": filter });
        }

        aggregate.push({
            "$project":
                {
                    "at_tag": 1, "at_tag": 1,
                    "hash_tag": 1,
                    "privacy": 1,
                    "mood_board_images": 1,
                    "status": 1,
                    "name": 1,
                    "start_date": 1,
                    "end_date": 1,
                    "call_to_action": 1,
                    "social_media_platform": 1,
                    "media_format": 1,
                    "location": 1,
                    "price": 1,
                    "currency": 1,
                    "promoter_id": 1,
                    "description": 1,
                    "cover_image": 1,
                    "days": {
                        "$divide": [{ "$subtract": ['$end_date', '$start_date'] }, 24 * 60 * 60 * 1000]
                    }
                }
        });

        var calendar = await Campaign.aggregate(aggregate);

        if (calendar && calendar.length > 0) {
            return { "status": 1, "message": "post found", "campaign": calendar };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        console.log("Error = ", err);
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}

campaign_helper.get_filtered_campaign_by_promoter = async (promoter_id, filter) => {


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

    var spend =
        {
            $group: {
                "_id": null,
                "total": { $sum: "$total_amount" }
            }
        }


    total_spent.push(spend);

    var applicants = [
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
            $lookup: {
                from: "users",
                localField: "campaign_user.user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },

    ]
    if (filter) {
        applicants.push({ "$match": filter });
    }
    applicants.push({
        $group: {
            "_id": null,
            "applicant": { $sum: 1 }
        }
    });


    var reach = [
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
            $lookup: {
                from: "users",
                localField: "campaign_user.user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
    ];
    if (filter) {
        reach.push({ "$match": filter });
    }
    reach.push({
        $group: {
            "_id": null,
            "total_social_power": { $sum: { $add: ["$user.facebook.no_of_friends", "$user.pinterest.no_of_followers", "$user.instagram.no_of_followers", "$user.twitter.no_of_followers", "$user.linkedin.no_of_connections"] } }
        }
    });


    var engagement = [
        {
            "$match": { "promoter_id": new ObjectId(promoter_id) }
        },
        {
            $lookup: {
                from: "campaign_post",
                localField: "_id",
                foreignField: "campaign_id",
                as: "campaign_user"
            }
        },
        {
            $unwind: "$campaign_user"
        },
        {
            $lookup: {
                from: "users",
                localField: "campaign_user.user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        }
    ];
    if (filter) {
        engagement.push({ "$match": filter });
    }

    engagement.push({
        $group: {
            "_id": null,
            "total": { $sum: { $add: ["$campaign_user.no_of_shares", "$campaign_user.no_of_likes", "$campaign_user.no_of_comments"] } }
        }
    });

    let purchased_post_cnt = await campaign_post_helper.count_purchase_post_by_promoter(promoter_id, filter);

    var camp = await Campaign.aggregate(purchase_post);
    var spent = await transaction.aggregate(total_spent);
    var applicant = await Campaign.aggregate(applicants);
    var reach_total = await Campaign.aggregate(reach);
    var engage = await Campaign.aggregate(engagement);

    if (camp && spent && applicant && reach_total && engage) {
        return {
            "status": 1, "message": "purchased campaign found", "purchased_campaign": (camp && camp[0] && camp[0].purchase_post) ? camp[0].purchase_post : 0,
            "total_spent": (spent && spent[0] && spent[0].total) ? spent[0].total : 0, "number_of_appplicants": (applicant && applicant[0] && applicant[0].applicant) ? applicant[0].applicant : 0,
            "no_of_reach_total": (reach && reach[0] && reach[0].total_social_power) ? reach[0].total_social_power : 0,
            "total_no_of_engagement": (engage && engage[0] && engage[0].total) ? engage[0].total : 0
        };
    } else {
        return { "status": 2, "message": "No campaign available" };
    }
}
module.exports = campaign_helper;