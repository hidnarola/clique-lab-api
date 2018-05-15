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

campaign_helper.get_users_approved_campaign = async (user_id, filter, redact, sort, page_no, page_size) => {
    try {
        let aggregate = [
            {
                "$match": {
                    "user_id": new ObjectId(user_id),
                    "is_purchase": true
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
            }
        ];

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
                'results': { "$push": "$campaign" }
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

        var approved_campaign = await Campaign_User.aggregate(aggregate);

        if (approved_campaign && approved_campaign[0].campaign.length > 0) {
            approved_campaign[0].campaign.map(function(campaign){
                if(campaign.price){
                    campaign.price = (campaign.price * 70 / 100).toFixed(2);
                } else {
                    campaign.price = 0;
                }
                return campaign;
            });
            return { "status": 1, "message": "User's approved campaign found", "results": approved_campaign[0] };
        } else {
            return { "status": 2, "message": "No approve campaign available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}

campaign_helper.get_public_campaign = async (filter, redact, sort, page_no, page_size) => {
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
            campaign[0].campaign.map(function(campaign){
                if(campaign.price){
                    campaign.price = (campaign.price * 70 / 100).toFixed(2);
                } else {
                    campaign.price = 0;
                }
                return campaign;
            });
            return { "status": 1, "message": "campaign found", "results": campaign[0] };
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

campaign_helper.get_campaign_by_id = async (campaign_id) => {
    try {
        var campaign = await Campaign.findOne({ _id: campaign_id }).lean();
        if (campaign) {
            return { "status": 1, "message": "campaign found", "Campaign": campaign};
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

campaign_helper.update_campaign_user = async (user_id, campaign_id, obj) => {
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
campaign_helper.get_user_offer = async (user_id, filter, redact, sort, page_no, page_size) => {
    try {
        let aggregate = [
            {
                "$match": {
                    "user_id": new ObjectId(user_id),
                    "is_apply": false
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
            }
        ];

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
                'results': { "$push": "$campaign" }
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

        var user_offers = await Campaign_User.aggregate(aggregate);

        if (user_offers && user_offers[0] && user_offers[0].campaign.length > 0) {
            user_offers[0].campaign.map(function(campaign){
                if(campaign.price){
                    campaign.price = (campaign.price * 70 / 100).toFixed(2);
                } else {
                    campaign.price = 0;
                }
                return campaign;
            });
            return { "status": 1, "message": "User's offer found", "results": user_offers[0] };
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
                "$group": {
                    "_id": null,
                    "total": { "$sum": 1 },
                    'campaigns': { "$push": '$$ROOT' }
                }
            },
            {
                "$unwind":"$campaigns"
            },
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
                    "total":1,
                    "campaigns._id": 1,
                    "campaigns.name": 1,
                    "campaigns.start_date": 1,
                    "campaigns.end_date": 1,
                    "campaigns.social_media_platform": 1,
                    "campaigns.media_format": 1,
                    "campaigns.location": 1,
                    "campaigns.price": 1,
                    "campaigns.currency": 1,
                    "campaigns.description": 1,
                    "campaigns.cover_image": 1,
                    "campaigns.submissions": { "$size": "$campaign_user" },
                    // "remianing_days": { $subtract: ["$end_date",new Date()] }
                }
            },
            {
                "$group":{
                    "_id":null,
                    "total":{"$first":"$total"},
                    "campaigns":{"$push":"$campaigns"}
                }
            }
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

campaign_helper.get_campaign_analysis_by_promoter = async (promoter_id, filter) => {
    let purchased_post_cnt = campaign_post_helper.count_purchase_post_by_promoter(promoter_id, filter);
    let spent = campaign_post_helper.total_spent_by_promoter(promoter_id, filter);
    let applicant_cnt = campaign_helper.get_campaign_total_applicant_by_promoter(promoter_id, filter);
    let reach_total = campaign_helper.get_campaign_total_reach_by_promoter(promoter_id, filter);
    let engage_cnt = campaign_helper.get_total_engaged_person_by_promoter(promoter_id, filter);

    return {
        "purchased_campaign": await purchased_post_cnt,
        "total_spent": await spent,
        "number_of_appplicants": await applicant_cnt,
        "no_of_reach_total": await reach_total,
        "total_no_of_engagement": await engage_cnt
    };
}

campaign_helper.get_campaign_total_applicant_by_promoter = async (promoter_id, filter) => {
    let aggregate = [
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
        aggregate.push({ "$match": filter });
    }
    aggregate.push({
        $group: {
            "_id": null,
            "applicant": { $sum: 1 }
        }
    });

    var total_applicant = await Campaign.aggregate(aggregate);
    return (total_applicant && total_applicant[0] && total_applicant[0].applicant) ? total_applicant[0].applicant : 0;
};

campaign_helper.get_campaign_total_reach_by_promoter = async (promoter_id, filter) => {
    let aggregate = [
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
        aggregate.push({ "$match": filter });
    }
    aggregate.push({
        $group: {
            "_id": null,
            "total_social_power": { $sum: { $add: ["$user.facebook.no_of_friends", "$user.pinterest.no_of_followers", "$user.instagram.no_of_followers", "$user.twitter.no_of_followers", "$user.linkedin.no_of_connections"] } }
        }
    });

    let reach_total = await Campaign.aggregate(aggregate);
    return (reach_total && reach_total[0] && reach_total[0].total_social_power) ? reach_total[0].total_social_power : 0;
};

campaign_helper.get_total_engaged_person_by_promoter = async (promoter_id, filter) => {
    let aggregate = [
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
        aggregate.push({ "$match": filter });
    }

    aggregate.push({
        $group: {
            "_id": null,
            "total": { $sum: { $add: ["$campaign_user.no_of_shares", "$campaign_user.no_of_likes", "$campaign_user.no_of_comments"] } }
        }
    });

    var engaged_persons = await Campaign.aggregate(aggregate);
    return (engaged_persons && engaged_persons[0] && engaged_persons[0].total) ? engaged_persons[0].total : 0;
};

campaign_helper.get_campaign_social_analysis_by_promoter = async (promoter_id, filter, custom_filter) => {
    let aggregate = [
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
            "$unwind": "$campaign_user"
        },
        {
            "$match": { "campaign_user.is_purchase": true }
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
        }
    ];
    if (filter) {
        aggregate.push({ "$match": filter });
    }
    if (custom_filter) {
        aggregate.push({ "$match": custom_filter });
    }

    aggregate.push({
        "$lookup": {
            "from": "campaign_post",
            "localField": "_id",
            "foreignField": "campaign_id",
            "as": "campaign_post"
        }
    });

    aggregate.push({
        "$unwind": "$campaign_post"
    });

    aggregate.push({
        "$project": {
            "_id": 1,
            "campaign_post": 1,
            "start_date": 1,
            "month": { $month: "$start_date" }
        }
    });

    aggregate.push({
        "$group": {
            "_id": "$month",
            "like_cnt": { "$sum": "$campaign_post.no_of_likes" },
            "comment_cnt": { "$sum": "$campaign_post.no_of_comments" },
            "share_cnt": { "$sum": "$campaign_post.no_of_shares" }
        }
    });

    console.log("Aggregate = ", JSON.stringify(aggregate));

    let result = await Campaign.aggregate(aggregate);
    return result;
}

campaign_helper.count_country_of_user = async (promoter_id) => {
    var aggregate = [
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
            "$unwind": "$campaign_user"
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
            "$unwind": "$user"
        },
        {
            "$lookup": {
                "from": "country",
                "localField": "user.country",
                "foreignField": "_id",
                "as": "country"
            }
        },
        {
            "$unwind": "$country"
        },
        {
            "$group": {
                "_id": "$country._id",
                "name": {
                    "$first": "$country.name"
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            "$group": {
                "_id": null,
                "country": {
                    "$push": "$$ROOT"
                },
                "total": {
                    "$sum": "$count"
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            "$unwind": "$country"
        },
        {
            $addFields: {
                "country.percentage_value": { "$multiply": [{ "$divide": ["$country.count", "$total"] }, 100] }
            }
        },
        {
            "$group": {
                "_id": null,
                "country": { $push: "$country" },
                "total": { $first: "$total" }
            }
        }
    ];



    let result = await Campaign.aggregate(aggregate);

    if (result) {
        return { "status": 1, "message": "found", "country": result };
    } else {
        return { "status": 0, "message": "Error occured while finding", "error": err };
    }
};

campaign_helper.count_state_of_user = async (promoter_id) => {
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
        },
        {
            "$group":
                { _id: "$user.state", count: { $sum: 1 } }
        },
        {
            "$group": {
                "_id": null,
                "state": { $push: "$$ROOT" },
                "total": { $sum: "$count" },

            }
        },
        {
            "$unwind": "$state"
        },
        {
            $addFields: {
                "state.percentage_value": { "$multiply": [{ "$divide": ["$state.count", "$total"] }, 100] }
            }
        },
        {
            "$group": {
                "_id": null,
                "state": { $push: "$state" },
                "total": { $first: "$total" }
            }
        }
    ];

    let result = await Campaign.aggregate(aggregate);

    if (result) {
        return { "status": 1, "message": "found", "state": result };
    } else {
        return { "status": 0, "message": "Error occured while finding", "error": err };
    }
};

campaign_helper.count_suburb_of_user = async (promoter_id) => {
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
        },
        {
            "$group":
                { _id: "$user.suburb", count: { $sum: 1 } }
        },
        {
            "$group": {
                "_id": null,
                "suburb": { $push: "$$ROOT" },
                "total": { $sum: "$count" },

            }
        },
        {
            "$unwind": "$suburb"
        },
        {
            $addFields: {
                "suburb.percentage_value": { "$multiply": [{ "$divide": ["$suburb.count", "$total"] }, 100] }
            }
        },
        {
            "$group": {
                "_id": null,
                "suburb": { $push: "$suburb" },
                "total": { $first: "$total" }
            }
        }

    ];

    let result = await Campaign.aggregate(aggregate);

    if (result) {
        return { "status": 1, "message": "found", "suburb": result };
    } else {
        return { "status": 0, "message": "Error occured while finding", "error": err };
    }
};

campaign_helper.count_gender_of_user = async (promoter_id) => {
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
        },
        {
            "$group":
                { _id: "$user.gender", count: { $sum: 1 } }
        },
        {
            "$group": {
                "_id": null,
                "gender": { $push: "$$ROOT" },
                "total": { $sum: "$count" },

            }
        },
        {
            "$unwind": "$gender"
        },
        {
            $addFields: {
                "gender.percentage_value": { "$multiply": [{ "$divide": ["$gender.count", "$total"] }, 100] }
            }
        },
        {
            "$group": {
                "_id": null,
                "gender": { $push: "$gender" },
                "total": { $first: "$total" }
            }
        }

    ];

    let gender = await Campaign.aggregate(aggregate);

    if (gender) {
        return { "status": 1, "message": "found", "gender": gender };
    } else {
        return { "status": 0, "message": "Error occured while finding", "error": err };
    }
};

campaign_helper.count_job_industry_of_user = async (promoter_id) => {
    var aggregate = [
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
            "$unwind": "$campaign_user"
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
            "$unwind": "$user"
        },
        {
            "$lookup": {
                "from": "job_industry",
                "localField": "user.job_industry",
                "foreignField": "_id",
                "as": "job_industry"
            }
        },
        {
            "$unwind": "$job_industry"
        },
        {
            "$group": {
                "_id": "$job_industry._id",
                "name": {
                    "$first": "$job_industry.name"
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            "$group": {
                "_id": null,
                "job_industry": {
                    "$push": "$$ROOT"
                },
                "total": {
                    "$sum": "$count"
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            "$unwind": "$job_industry"
        },
        {
            $addFields: {
                "job_industry.percentage_value": { "$multiply": [{ "$divide": ["$job_industry.count", "$total"] }, 100] }
            }
        },
        {
            "$group": {
                "_id": null,
                "job_industry": { $push: "$job_industry" },
                "total": { $first: "$total" }
            }
        }
    ];

    let result = await Campaign.aggregate(aggregate);

    if (result) {
        return { "status": 1, "message": "found", "job_industry": result };
    } else {
        return { "status": 0, "message": "Error occured while finding", "error": err };
    }
};

campaign_helper.count_education_of_user = async (promoter_id) => {
    var aggregate = [
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
            "$unwind": "$campaign_user"
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
            "$unwind": "$user"
        },
        {
            "$lookup": {
                "from": "educations",
                "localField": "user.education",
                "foreignField": "_id",
                "as": "education"
            }
        },
        {
            "$unwind": "$education"
        },
        {
            "$group": {
                "_id": "$education._id",
                "name": {
                    "$first": "$education.name"
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            "$group": {
                "_id": null,
                "education": {
                    "$push": "$$ROOT"
                },
                "total": {
                    "$sum": "$count"
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            "$unwind": "$education"
        },
        {
            $addFields: {
                "education.percentage_value": { "$multiply": [{ "$divide": ["$education.count", "$total"] }, 100] }
            }
        },
        {
            "$group": {
                "_id": null,
                "education": { $push: "$education" },
                "total": { $first: "$total" }
            }
        }
    ];

    let result = await Campaign.aggregate(aggregate);

    if (result) {
        return { "status": 1, "message": "found", "education": result };
    } else {
        return { "status": 0, "message": "Error occured while finding", "error": err };
    }
};

campaign_helper.count_language_of_user = async (promoter_id) => {
    var aggregate = [
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
            "$unwind": "$campaign_user"
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
            "$unwind": "$user"
        },
        {
            "$lookup": {
                "from": "languages",
                "localField": "user.language",
                "foreignField": "_id",
                "as": "language"
            }
        },
        {
            "$unwind": "$language"
        },
        {
            "$group": {
                "_id": "$language._id",
                "name": {
                    "$first": "$language.name"
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            "$group": {
                "_id": null,
                "language": {
                    "$push": "$$ROOT"
                },
                "total": {
                    "$sum": "$count"
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            "$unwind": "$language"
        },
        {
            $addFields: {
                "language.percentage_value": { "$multiply": [{ "$divide": ["$language.count", "$total"] }, 100] }
            }
        },
        {
            "$group": {
                "_id": null,
                "education": { $push: "$language" },
                "total": { $first: "$total" }
            }
        }
    ];

    let result = await Campaign.aggregate(aggregate);

    if (result) {
        return { "status": 1, "message": "found", "language": result };
    } else {
        return { "status": 0, "message": "Error occured while finding", "error": err };
    }
};

campaign_helper.count_ethnicity_of_user = async (promoter_id) => {
    var aggregate = [
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
            "$unwind": "$campaign_user"
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
            "$unwind": "$user"
        },
        {
            "$lookup": {
                "from": "ethnicity",
                "localField": "user.ethnicity",
                "foreignField": "_id",
                "as": "ethnicity"
            }
        },
        {
            "$unwind": "$ethnicity"
        },
        {
            "$group": {
                "_id": "$ethnicity._id",
                "name": {
                    "$first": "$ethnicity.name"
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            "$group": {
                "_id": null,
                "ethnicity": {
                    "$push": "$$ROOT"
                },
                "total": {
                    "$sum": "$count"
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            "$unwind": "$ethnicity"
        },
        {
            $addFields: {
                "ethnicity.percentage_value": { "$multiply": [{ "$divide": ["$ethnicity.count", "$total"] }, 100] }
            }
        },
        {
            "$group": {
                "_id": null,
                "ethnicity": { $push: "$ethnicity" },
                "total": { $first: "$total" }
            }
        }
    ];

    let result = await Campaign.aggregate(aggregate);

    if (result) {
        return { "status": 1, "message": "found", "ethnicity": result };
    } else {
        return { "status": 0, "message": "Error occured while finding", "error": err };
    }
};

campaign_helper.count_music_taste_of_user = async (promoter_id) => {
    var aggregate = [
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
            "$unwind": "$campaign_user"
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
            "$unwind": "$user"
        },
        {
            "$lookup": {
                "from": "music_taste",
                "localField": "user.music_taste",
                "foreignField": "_id",
                "as": "music_taste"
            }
        },
        {
            "$unwind": "$music_taste"
        },
        {
            "$group": {
                "_id": "$music_taste._id",
                "name": {
                    "$first": "$music_taste.name"
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            "$group": {
                "_id": null,
                "music_taste": {
                    "$push": "$$ROOT"
                },
                "total": {
                    "$sum": "$count"
                },
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            "$unwind": "$music_taste"
        },
        {
            $addFields: {
                "music_taste.percentage_value": { "$multiply": [{ "$divide": ["$music_taste.count", "$total"] }, 100] }
            }
        },
        {
            "$group": {
                "_id": null,
                "music_taste": { $push: "$music_taste" },
                "total": { $first: "$total" }
            }
        }
    ];

    let result = await Campaign.aggregate(aggregate);

    if (result) {
        return { "status": 1, "message": "found", "music_taste": result };
    } else {
        return { "status": 0, "message": "Error occured while finding", "error": err };
    }
};

campaign_helper.count_relationship_status_of_user = async (promoter_id) => {
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
        },
        {
            "$group":
                { _id: "$user.relationship_status", count: { $sum: 1 } }
        },
        {
            "$group": {
                "_id": null,
                "relationship_status": { $push: "$$ROOT" },
                "total": { $sum: "$count" },

            }
        },
        {
            "$unwind": "$relationship_status"
        },
        {
            $addFields: {
                "relationship_status.percentage_value": { "$multiply": [{ "$divide": ["$relationship_status.count", "$total"] }, 100] }
            }
        },
        {
            "$group": {
                "_id": null,
                "relationship_status": { $push: "$relationship_status" },
                "total": { $first: "$total" }
            }
        }

    ];

    let result = await Campaign.aggregate(aggregate);

    if (result) {
        return { "status": 1, "message": "found", "relationship_status": result };
    } else {
        return { "status": 0, "message": "Error occured while finding", "error": err };
    }
};

campaign_helper.count_sexual_orientation_of_user = async (promoter_id) => {
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
        },
        {
            "$group":
                { _id: "$user.sexual_orientation", count: { $sum: 1 } }
        },
        {
            "$group": {
                "_id": null,
                "sexual_orientation": { $push: "$$ROOT" },
                "total": { $sum: "$count" },

            }
        },
        {
            "$unwind": "$sexual_orientation"
        },
        {
            $addFields: {
                "sexual_orientation.percentage_value": { "$multiply": [{ "$divide": ["$sexual_orientation.count", "$total"] }, 100] }
            }
        },
        {
            "$group": {
                "_id": null,
                "sexual_orientation": { $push: "$sexual_orientation" },
                "total": { $first: "$total" }
            }
        }

    ];

    let result = await Campaign.aggregate(aggregate);

    if (result) {
        return { "status": 1, "message": "found", "sexual_orientation": result };
    } else {
        return { "status": 0, "message": "Error occured while finding", "error": err };
    }
};

module.exports = campaign_helper;