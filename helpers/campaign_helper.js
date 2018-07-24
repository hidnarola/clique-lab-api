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
var Campaign_post = require("./../models/Campaign_post");

var campaign_post_helper = require('./campaign_post_helper');

var ObjectId = mongoose.Types.ObjectId;

var campaign_helper = {};

campaign_helper.get_all_applied_campaign = async () => {
    try {
        var applied_campaign = await Campaign_Applied.find({});
        if (applied_campaign && applied_campaign.length > 0) {
            return { "status": 1, "message": "Applied campaign found", "applied_campaign": applied_campaign };
        } else {
            return { "status": 2, "message": "No applied campaign found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding applied campaigns", "error": err }
    }
};

campaign_helper.get_all_campaign = async () => {
    try {
        var campaigns = await Campaign.find({});
        if (campaigns && campaigns.length > 0) {
            return { "status": 1, "message": "Campaign found", "campaigns": campaigns };
        } else {
            return { "status": 2, "message": "No campaign found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Campaigns", "error": err }
    }
};

campaign_helper.get_users_approved_campaign = async (user_id, filter, redact, sort, page_no, page_size) => {
    try {
        let aggregate = [
            {
                "$match": {
                    "user_id": new ObjectId(user_id),
                    "is_purchase": true,
                    "is_posted": false
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
                "$match": {
                    "campaign.end_date": { "$gt": new Date() }
                }
            },
            {
                "$lookup": {
                    "from": "campaign_applied",
                    "localField": "campaign._id",
                    "foreignField": "campaign_id",
                    "as": "applied_campaign"
                }
            },
            {
                "$unwind": "$applied_campaign"
            },
            {
                "$match": {
                    "applied_campaign.user_id": new ObjectId(user_id),
                    "applied_campaign.created_at": {
                        "$gte": moment().subtract(3, "days").toDate()
                    }
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "campaign": { $mergeObjects: ["$campaign", "$applied_campaign"] }
                }
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

        if (approved_campaign && approved_campaign[0] && approved_campaign[0].campaign.length > 0) {
            approved_campaign[0].campaign.map(function (campaign) {
                if (campaign.price) {
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

campaign_helper.get_users_approved_post = async (user_id, filter, search, sort, page_no, page_size) => {
    try {
        let regex = new RegExp(search);
        let hash = search.replace(/^#+/,"");
        let at = search.replace(/^@+/,"");

        let aggregate = [
            {
                "$match": {
                    "user_id": new ObjectId(user_id),
                    "is_purchase": true,
                    "is_posted": false,
                    "purchased_at": { "$gte": moment().subtract(3, "days").toDate() }
                }
            },
            {
                "$facet": {
                    "applied_post": [{
                        "$lookup": {
                            "from": "campaign_applied",
                            "localField": "applied_post_id",
                            "foreignField": "_id",
                            "as": "applied_post"
                        }
                    },
                    {
                        "$unwind": "$applied_post"
                    },
                    {
                        "$lookup": {
                            "from": "campaign",
                            "localField": "applied_post.campaign_id",
                            "foreignField": "_id",
                            "as": "campaign"
                        }
                    },
                    {
                        "$unwind": "$campaign"
                    },
                    {
                        "$match":filter
                    },
                    // {
                    //     "$match": {
                    //         "campaign.end_date": { "$gte": new Date() }
                    //     }
                    // },
                    {
                        "$project": {
                            "_id": 1,
                            "type": "applied_post",
                            "social_media_platform": "$campaign.social_media_platform",
                            "price": "$campaign.price",
                            "currency": "$campaign.currency",
                            "promoter_id": "$campaign.promoter_id",
                            "cover_image": "$campaign.cover_image",
                            "purchased_at": 1,
                            "campaign": {
                                "_id": "$campaign._id",
                                "hash_tag": "$campaign.hash_tag",
                                "at_tag": "$campaign.at_tag",
                                "privacy": "$campaign.privacy",
                                "name": "$campaign.name",
                                "media_format": "$campaign.media_format",
                                "description": "$campaign.description"
                            },
                            "applied_post": {
                                "_id": "$applied_post._id",
                                "description": "$applied_post.desription",
                                "image": "$applied_post.image"
                            }
                        }
                    }],
                    "inspired_post": [{
                        "$lookup": {
                            "from": "inspired_brands",
                            "localField": "inspired_post_id",
                            "foreignField": "_id",
                            "as": "inspired_post"
                        }
                    },
                    {
                        "$unwind": "$inspired_post"
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "type": "inspired_post",
                            "social_media_platform": "$inspired_post.social_media_platform",
                            "price": "$inspired_post.price",
                            "cover_image": "$inspired_post.image",
                            "promoter_id": "$inspired_post.brand_id",
                            "purchased_at": 1,
                            "inspired_post": {
                                "_id": "$inspired_post._id",
                                "description": "$inspired_post.text"
                            }
                        }
                    }]
                }
            },
            {
                "$project": {
                    "data": {
                        "$concatArrays": ["$applied_post", "$inspired_post"]
                    }
                }
            },
            {
                "$unwind": "$data"
            },
            {
                "$replaceRoot": { "newRoot": "$data" }
            },
            {
                "$lookup": {
                    "from": "promoters",
                    "localField": "promoter_id",
                    "foreignField": "_id",
                    "as": "promoter"
                }
            },
            {
                "$unwind": "$promoter"
            },
            {
                "$match": {
                    "promoter.status": true,
                    "promoter.removed": false,
                }
            },
            {
                "$facet": {
                    "tagMatch": [{
                        "$redact": {
                            "$cond": {
                                "if": {
                                    "$or": [
                                        {
                                            "$setIsSubset": [
                                                [at],
                                                "$campaign.at_tag"
                                            ]
                                        },
                                        {
                                            "$setIsSubset": [
                                                [hash],
                                                "$campaign.hash_tag"
                                            ]
                                        }
                                    ]
                                },
                                "then": "$$KEEP",
                                "else": "$$PRUNE"
                            }
                        }
                    }],
                    "nameMatch": [{
                        "$match": {
                            "campaign.name": { "$regex": regex, "$options": "i" }
                        }
                    }],
                    "companyMatch": [{
                        "$match": {
                            "promoter.company": { "$regex": regex, "$options": "i" }
                        }
                    }]
                }
            },
            {
                "$project": {
                    "data": {
                        "$concatArrays": ["$tagMatch", "$nameMatch","$companyMatch"]
                    }
                }
            },
            {
                "$unwind": "$data"
            },
            { "$replaceRoot": { "newRoot": "$data" } }
        ];

        if (sort) {
            aggregate.push({ "$sort": sort });
        }

        aggregate.push({
            "$group": {
                "_id": "$_id",
                "campaign":{"$first":"$$ROOT"}
            }
        });

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

        if (approved_campaign && approved_campaign[0] && approved_campaign[0].campaign.length > 0) {
            approved_campaign[0].campaign.map(function (campaign) {
                if (campaign.price) {
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

campaign_helper.get_public_campaign_for_user = async (user_id, filter, search, sort, page_no, page_size) => {
    try {
        let regex = new RegExp(search);
        let hash = search.replace(/^#+/,"");
        let at = search.replace(/^@+/,"");

        let applied_campaigns = await Campaign_Applied.aggregate([
            {
                "$match":{
                    "user_id":new ObjectId(user_id)
                }
            },
            {
                "$group":{
                    "_id":null,
                    "campaigns":{"$push":"$campaign_id"}
                }
            }
        ]);

        console.log("Campaigns ==> ",applied_campaigns[0].campaigns);

        var aggregate = [
            {
                "$match": {
                    "end_date": { "$gt": new Date() },
                    "start_date": { "$lt": new Date() },
                    "_id":{"$nin":applied_campaigns[0].campaigns}
                }
            },
            {
                "$match":filter
            },
            {
                "$lookup": {
                    "from": "promoters",
                    "localField": "promoter_id",
                    "foreignField": "_id",
                    "as": "promoter"
                }
            },
            {
                "$unwind": "$promoter"
            },
            {
                "$match": {
                    "promoter.status": true,
                    "promoter.removed": false,
                }
            },
            {
                "$facet": {
                    "tagMatch": [{
                        "$redact": {
                            "$cond": {
                                "if": {
                                    "$or": [
                                        {
                                            "$setIsSubset": [
                                                [at],
                                                "$at_tag"
                                            ]
                                        },
                                        {
                                            "$setIsSubset": [
                                                [hash],
                                                "$hash_tag"
                                            ]
                                        }
                                    ]
                                },
                                "then": "$$KEEP",
                                "else": "$$PRUNE"
                            }
                        }
                    }],
                    "nameMatch": [{
                        "$match": {
                            "name": { "$regex": regex, "$options": "i" }
                        }
                    }],
                    "companyMatch": [{
                        "$match": {
                            "promoter.company": { "$regex": regex, "$options": "i" }
                        }
                    }]
                }
            },
            {
                "$project": {
                    "data": {
                        "$concatArrays": ["$tagMatch", "$nameMatch","$companyMatch"]
                    }
                }
            },
            {
                "$unwind": "$data"
            },
            { "$replaceRoot": { "newRoot": "$data" } },
            // {
            //     "$lookup":
            //     {
            //         "from": "campaign_applied",
            //         "localField": "_id",
            //         "foreignField": "campaign_id",
            //         "as": "campaign"
            //     }
            // },
            // {
            //     "$unwind": { "path": "$campaign", "preserveNullAndEmptyArrays": true }
            // },
            // {
            //     "$match": {
            //         "campaign.user_id": { "$ne": new ObjectId(user_id) }
            //     }
            // }
        ];
        
        if (sort) {
            aggregate.push({ "$sort": sort });
        }

        aggregate.push({
            "$group": {
                "_id": "$_id",
                "campaign":{"$first":"$$ROOT"}
            }
        });

        aggregate.push({
            "$group": {
                "_id": null,
                "total": { "$sum": 1 },
                'results': { "$push": '$campaign' }
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

        console.log("Aggregate ==> ", JSON.stringify(aggregate));

        var campaign = await Campaign.aggregate(aggregate);

        if (campaign && campaign[0] && campaign[0].campaign.length > 0) {
            campaign[0].campaign.map(function (campaign) {
                if (campaign.price) {
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
                "promoter_id": new ObjectId(promoter_id),
                "end_date": { "$gt": new Date() },
                "privacy": "invite"
            }
        }];

        var campaign = await Campaign.aggregate(aggregate);
        console.log("Campaign = ", campaign);

        if (campaign && campaign.length > 0) {
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
            return { "status": 1, "message": "campaign found", "Campaign": campaign };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}

campaign_helper.get_applied_post_by_id = async (post_id) => {
    try {
        var post = await Campaign_Applied.findOne({ _id: post_id }).lean();
        if (post) {
            return { "status": 1, "message": "Post found", "post": post };
        } else {
            return { "status": 2, "message": "No post available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding post", "error": err }
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
        let campaign_user_data = await Campaign_User.insertMany(campaign_user_array, { ordered: false });
        return { "status": 1, "message": "User added in campaign", "campaign_user": campaign_user_data };
    } catch (err) {
        if (err.name == "BulkWriteError") {
            return { "status": 1, "message": "User added in campaign" };
        } else {
            return { "status": 0, "message": "Error occured while inserting into campaign_user", "error": err };
        }
        console.log("error ==> ", err);
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
campaign_helper.get_user_offer = async (user_id, filter, search, sort, page_no, page_size) => {
    try {
        let regex = new RegExp(search);

        let hash = search.replace(/^#+/,"");
        let at = search.replace(/^@+/,"");

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
            },
            {
                "$match": {
                    "campaign.end_date": { "$gt": new Date() },
                    "campaign.start_date": { "$lt": new Date() }
                }
            },
            {
                "$match":filter
            },
            {
                "$lookup": {
                    "from": "promoters",
                    "localField": "campaign.promoter_id",
                    "foreignField": "_id",
                    "as": "promoter"
                }
            },
            {
                "$unwind": "$promoter"
            },
            {
                "$match": {
                    "promoter.status": true,
                    "promoter.removed": false,
                }
            },
            {
                "$facet": {
                    "tagMatch": [{
                        "$redact": {
                            "$cond": {
                                "if": {
                                    "$or": [
                                        {
                                            "$setIsSubset": [
                                                [at],
                                                "$campaign.at_tag"
                                            ]
                                        },
                                        {
                                            "$setIsSubset": [
                                                [hash],
                                                "$campaign.hash_tag"
                                            ]
                                        }
                                    ]
                                },
                                "then": "$$KEEP",
                                "else": "$$PRUNE"
                            }
                        }
                    }],
                    "nameMatch": [{
                        "$match": {
                            "campaign.name": { "$regex": regex, "$options": "i" }
                        }
                    }],
                    "companyMatch": [{
                        "$match": {
                            "promoter.company": { "$regex": regex, "$options": "i" }
                        }
                    }]
                }
            },
            {
                "$project": {
                    "data": {
                        "$concatArrays": ["$tagMatch", "$nameMatch","$companyMatch"]
                    }
                }
            },
            {
                "$unwind": "$data"
            },
            { "$replaceRoot": { "newRoot": "$data" } }
        ];

        if (sort) {
            aggregate.push({ "$sort": sort });
        }

        aggregate.push({
            "$group": {
                "_id": "$campaign._id",
                "campaign":{"$first":"$campaign"}
            }
        });

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

        console.log("Aggregate ==> ", JSON.stringify(aggregate));
        var user_offers = await Campaign_User.aggregate(aggregate);

        if (user_offers && user_offers[0] && user_offers[0].campaign.length > 0) {
            user_offers[0].campaign.map(function (campaign) {
                if (campaign.price) {
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
                "$match": {
                    "promoter_id": new ObjectId(promoter_id),
                    "end_date": { "$gt": new Date() },
                    "privacy": "invite"
                }
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
            // {
            //     "$lookup":{
            //         "from":"users",
            //         "localField":""
            //     }
            // }
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
                "$unwind": "$campaigns"
            },
            {
                "$skip": page_size * (page_no - 1)
            },
            {
                "$limit": page_size
            },
            {
                "$lookup": {
                    "from": "campaign_applied",
                    "localField": "campaigns._id",
                    "foreignField": "campaign_id",
                    "as": "campaigns.campaign_submission"
                }
            },
            {
                "$project": {
                    "total": 1,
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
                    "campaigns.submissions": { "$size": "$campaigns.campaign_submission" },
                    // "remianing_days": { $subtract: ["$end_date",new Date()] }
                }
            },
            {
                "$group": {
                    "_id": null,
                    "total": { "$first": "$total" },
                    "campaigns": { "$push": "$campaigns" }
                }
            }
        ]);

        if (campaigns && campaigns[0] && campaigns[0].campaigns.length > 0) {
            _.map(campaigns[0].campaigns, function (campaign) {
                campaign.remaining_days = moment(campaign.end_date).diff(moment(), 'days') + 1;
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
                campaign.starts_in = moment(campaign.start_date).diff(moment(), 'days') + 1;
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
            { "$sort": { "end_date": -1 } },
            {
                "$group": {
                    "_id": null,
                    "total": { "$sum": 1 },
                    'campaigns': { "$push": '$$ROOT' }
                }
            },
            {
                "$unwind": "$campaigns"
            },
            {
                "$skip": page_size * (page_no - 1)
            },
            {
                "$limit": page_size
            },
            {
                "$lookup": {
                    "from": "campaign_applied",
                    "localField": "campaigns._id",
                    "foreignField": "campaign_id",
                    "as": "campaigns.campaign_submission"
                }
            },
            {
                "$project": {
                    "total": 1,
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
                    "campaigns.submissions": { "$size": "$campaigns.campaign_submission" },
                    // "remianing_days": { $subtract: ["$end_date",new Date()] }
                }
            },
            {
                "$group": {
                    "_id": null,
                    "total": { "$first": "$total" },
                    "campaigns": { "$push": "$campaigns" }
                }
            }
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

campaign_helper.get_purchased_post_by_promoter = async (promoter_id, page_no, page_size, filter, sort) => {
    try {
        var aggregate = [
            {
                "$match": {
                    "is_purchase": true
                }
            },
            {
                "$lookup": {
                    "from": "campaign_applied",
                    "foreignField": "_id",
                    "localField": "applied_post_id",
                    "as": "applied_post"
                }
            },
            {
                "$unwind": {
                    "path": "$applied_post",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "campaign",
                    "foreignField": "_id",
                    "localField": "applied_post.campaign_id",
                    "as": "campaign"
                }
            },
            {
                "$unwind": {
                    "path": "$campaign",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "inspired_brands",
                    "foreignField": "_id",
                    "localField": "inspired_post_id",
                    "as": "inspired_post"
                }
            },
            {
                "$unwind": {
                    "path": "$inspired_post",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$redact": {
                    "$cond": [
                        {
                            "$or": [
                                { "$eq": ["$campaign.promoter_id", new ObjectId(promoter_id)] },
                                { "$eq": ["$inspired_post.brand_id", new ObjectId(promoter_id)] }
                            ]
                        },
                        "$$KEEP",
                        "$$PRUNE"
                    ]
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "foreignField": "_id",
                    "localField": "user_id",
                    "as": "user"
                }
            },
            {
                "$unwind": "$user"
            },
            {
                "$lookup": {
                    "from": "country",
                    "foreignField": "_id",
                    "localField": "user.country",
                    "as": "user.country"
                }
            },
            {
                "$unwind": {
                    "path": "$user.country",
                    "preserveNullAndEmptyArrays": true
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
                    "_id": null,
                    "post": { $push: "$$ROOT" }
                }
            });

        if (page_size && page_no) {
            aggregate.push({
                "$project": {
                    "_id": "$_id",
                    "total": { "$size": "$post" },
                    "post": { "$slice": ["$post", page_size * (page_no - 1), page_size] }
                }
            });
        } else {
            aggregate.push({
                "$project": {
                    "_id": "$_id",
                    "total": { "$size": "$post" },
                    "post": "$post"
                }
            });
        }

        console.log("aggregate ==> ", JSON.stringify(aggregate));

        var post = await Campaign_User.aggregate(aggregate);

        console.log("Post ==> ", post);

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
    let applicant_cnt = campaign_helper.get_campaign_total_applicant_by_promoter(promoter_id, filter);
    let reach_total = campaign_helper.get_campaign_total_reach_by_promoter(promoter_id, filter);
    let engage_cnt = campaign_helper.get_total_engaged_person_by_promoter(promoter_id, filter);
    let purchased_post_cnt = await campaign_post_helper.count_purchase_post_by_promoter(promoter_id, filter);
    let spent = await campaign_post_helper.total_spent_by_promoter(promoter_id, filter);
    let average_cost_per_purchase = (purchased_post_cnt && purchased_post_cnt > 0) ? (spent / purchased_post_cnt) : 0

    return {
        "average_cost_per_purchase": average_cost_per_purchase,
        "purchased_campaign": purchased_post_cnt,
        "total_spent": spent,
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
            "total_social_power": { $sum: { $add: ["$user.facebook.no_of_friends", "$user.pinterest.no_of_friends", "$user.instagram.no_of_friends", "$user.twitter.no_of_friends", "$user.linkedin.no_of_friends"] } }
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
            "month": { "$month": "$start_date" }
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
            "$match": {
                "user.status": true,
                "user.removed": false
            }
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
                "country.percentage_value": { "$multiply": [{ "$divide": ["$country.count", "$total"] }, 100] },
                "key": "Country"
            }
        },
        {
            "$group": {
                "_id": null,
                "country": { $push: "$country" },
                "total": { $first: "$total" },
                "key": { $first: "$key" }
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
            "$match": {
                "user.status": true,
                "user.removed": false
            }
        },
        {
            "$group":
                { _id: "$user.state", name: { "$first": "$user.state" }, count: { $sum: 1 } }
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
                "state.percentage_value": { "$multiply": [{ "$divide": ["$state.count", "$total"] }, 100] },
                "key": "State"
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
            "$match": {
                "user.status": true,
                "user.removed": false
            }
        },
        {
            "$group":
                { _id: "$user.suburb", name: { "$first": "$user.suburb" }, count: { $sum: 1 } }
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
                "suburb.percentage_value": { "$multiply": [{ "$divide": ["$suburb.count", "$total"] }, 100] },
                "key": "Suburb"
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
            "$match": {
                "user.status": true,
                "user.removed": false
            }
        },
        {
            "$group":
                { _id: "$user.gender", name: { "$first": "$user.gender" }, count: { $sum: 1 } }
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
                "gender.percentage_value": { "$multiply": [{ "$divide": ["$gender.count", "$total"] }, 100] },
                "key": "Gender"
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
            "$match": {
                "user.status": true,
                "user.removed": false
            }
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
                "job_industry.percentage_value": { "$multiply": [{ "$divide": ["$job_industry.count", "$total"] }, 100] },
                "key": "Job Industry"
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
            "$match": {
                "user.status": true,
                "user.removed": false
            }
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
                "education.percentage_value": { "$multiply": [{ "$divide": ["$education.count", "$total"] }, 100] },
                "key": "Education level"
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
            "$match": {
                "user.status": true,
                "user.removed": false
            }
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
                "language.percentage_value": { "$multiply": [{ "$divide": ["$language.count", "$total"] }, 100] },
                "key": "Languages spoken"
            }
        },
        {
            "$group": {
                "_id": null,
                "language": { $push: "$language" },
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
            "$match": {
                "user.status": true,
                "user.removed": false
            }
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
                    "$first": "$ethnicity.ethnicity"
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
                "ethnicity.percentage_value": { "$multiply": [{ "$divide": ["$ethnicity.count", "$total"] }, 100] },
                "key": "Ethnicity"
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
            "$match": {
                "user.status": true,
                "user.removed": false
            }
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
                "music_taste.percentage_value": { "$multiply": [{ "$divide": ["$music_taste.count", "$total"] }, 100] },
                "key": "Music Taste"
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
            "$match": {
                "user.status": true,
                "user.removed": false
            }
        },
        {
            "$group":
                { _id: "$user.relationship_status", "name": { "$first": "$user.relationship_status" }, count: { $sum: 1 } }
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
                "relationship_status.percentage_value": { "$multiply": [{ "$divide": ["$relationship_status.count", "$total"] }, 100] },
                "key": "Relationship status"
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
            "$match": {
                "user.status": true,
                "user.removed": false
            }
        },
        {
            "$group":
                { _id: "$user.sexual_orientation", name: { "$first": "$user.sexual_orientation" }, count: { $sum: 1 } }
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
                "sexual_orientation.percentage_value": { "$multiply": [{ "$divide": ["$sexual_orientation.count", "$total"] }, 100] },
                "key": "Sexual orienation"
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

/**
 * Developed by "ar"
 */
campaign_helper.get_total_people_applied_for_campaign = async (campaign_id) => {
    try {
        let count = await Campaign_Applied.find({ "campaign_id": campaign_id }).count();
        console.log("count ==> ", count);
        return { "status": 1, "message": "Applied count found for campaign", "count": count }
    } catch (err) {
        console.log("Error ==> ", err);
        return { "status": 0, "message": "Applied count not found for campaign" }
    }
};

/**
 * Get applied post of particular campaign
 * Developed by "ar"
 */
campaign_helper.get_applied_post_of_campaign = async (campaign_id, page_no, page_size, filter, sort) => {
    try {
        var aggregate = [
            {
                "$match": {
                    "campaign_id": new ObjectId(campaign_id),
                    "is_apply": true,
                    "is_purchase": false
                }
            },
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
                "$match": {
                    "user.status": true,
                    "user.removed": false
                }
            },
            {
                "$lookup": {
                    "from": "country",
                    "localField": "user.country",
                    "foreignField": "_id",
                    "as": "user.country"
                }
            },
            {
                "$unwind": { "path": "$user.country", "preserveNullAndEmptyArrays": true }
            }
        ];

        if (filter) {
            aggregate.push({ "$match": filter });
        }
        if (sort) {
            aggregate.push({ "$sort": sort });
        }

        aggregate = aggregate.concat([
            {
                "$lookup": {
                    "from": "campaign_applied",
                    "localField": "user._id",
                    "foreignField": "user_id",
                    "as": "applied_post"
                }
            },
            {
                "$unwind": "$applied_post"
            },
            {
                "$match": {
                    "applied_post.campaign_id": new ObjectId(campaign_id)
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
                "$project": {
                    "_id": 1,
                    "campaign_id": 1,
                    "user_id": 1,
                    "applied_at": "$created_at",
                    "user_name": "$user.name",
                    "email": "$user.email",
                    "facebook": "$user.facebook",
                    "instagram": "$user.instagram",
                    "twitter": "$user.twitter",
                    "pinterest": "$user.pinterest",
                    "linkedin": "$user.linkedin",
                    "user_avatar": "$user.image",
                    "country": "$user.country",
                    "suburb": "$user.suburb",
                    "username": "$user.username",
                    "applied_post_id": "$applied_post._id",
                    "applied_post_description": "$applied_post.desription",
                    "applied_post_image": "$applied_post.image",
                    "campaign_name": "$campaign.name",
                    "hash_tag": "$campaign.hash_tag",
                    "at_tag": "$campaign.at_tag",
                    "privacy": "$campaign.privacy",
                    "start_date": "$campaign.start_date",
                    "end_date": "$campaign.end_date",
                    "social_media_platform": "$campaign.social_media_platform",
                    "media_format": "$campaign.media_format",
                    "location": "$campaign.location",
                    "price": "$campaign.price",
                    "campaign_description": "$campaign.description",
                    "cover_image": "$campaign.cover_image",
                    "mood_board_image": "$campaign.mood_board_images"
                }
            }
        ]);

        aggregate.push(
            {
                "$group": {
                    "_id": null,
                    "applied_post": { $push: "$$ROOT" }
                }
            });

        if (page_size && page_no) {
            aggregate.push({
                "$project": {
                    "_id": "$_id",
                    "total": { "$size": "$applied_post" },
                    "users": { "$slice": ["$applied_post", page_size * (page_no - 1), page_size] }
                }
            });
        } else {
            aggregate.push({
                "$project": {
                    "_id": "$_id",
                    "total": { "$size": "$applied_post" },
                    "users": "$applied_post"
                }
            });
        }

        var campaign = await Campaign_User.aggregate(aggregate);

        if (campaign && campaign[0]) {
            return { "status": 1, "message": "Applied post found", "campaign": campaign[0] };
        } else {
            return { "status": 2, "message": "No applied post found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign's applied post", "error": err }
    }
}

/**
 * 
 */
campaign_helper.get_campaign_user = async (campaign_id, user_id) => {
    try {
        var campaign = await Campaign_user.findOne({ campaign_id: campaign_id, user_id: user_id }).lean();
        if (campaign) {
            return { "status": 1, "message": "campaign_user found", "campaign_user": campaign };
        } else {
            return { "status": 2, "message": "No record found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign_user", "error": err }
    }
}

/**
 * 
 */
campaign_helper.get_applied_campaign_by_user_and_campaign = async (user_id, campaign_id) => {
    let applied_post = await Campaign_Applied.findOne({ "user_id": user_id, "campaign_id": campaign_id });
    if (applied_post) {
        return { "status": 1, "message": "Applied post found", "applied_post": applied_post };
    } else {
        return { "status": 0, "message": "Applied post not found" };
    }
}

campaign_helper.update_campaign_user_by_inspired_post = async (inspired_post_id, obj) => {
    try {
        let user = await Campaign_User.findOneAndUpdate({ "inspired_post_id": new ObjectId(inspired_post_id) }, obj);

        if (!user) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated", "user": user };
        }
    } catch (err) {

        return { "status": 0, "message": "Error occured while updating user", "error": err }
    }
}

campaign_helper.get_posted_post_by_promoter = async (promoter_id, page_no, page_size, filter, sort) => {
    try {
        var aggregate = [
            {
                "$limit": 1
            },
            {
                "$facet": {

                    "applied_post": [
                        {
                            "$lookup": {
                                "from": "campaign",
                                "pipeline": [{
                                    "$match": {
                                        "promoter_id": new ObjectId(promoter_id)
                                    }
                                }],
                                "as": "campaign"
                            }
                        },
                        { "$project": { "campaign": 1, "_id": 0 } },
                        { "$unwind": "$campaign" },
                        { "$replaceRoot": { "newRoot": "$campaign" } },
                        {
                            "$lookup": {
                                "from": "campaign_applied",
                                "foreignField": "campaign_id",
                                "localField": "_id",
                                "as": "applied_post"
                            }
                        },
                        {
                            "$unwind": "$applied_post"
                        },
                        {
                            "$lookup": {
                                "from": "campaign_post",
                                "foreignField": "applied_post_id",
                                "localField": "applied_post._id",
                                "as": "campaign_post"
                            }
                        },
                        {
                            "$unwind": "$campaign_post"
                        },
                        {
                            "$project": {
                                "_id": "$campaign_post._id",
                                "type": "applied_post",
                                "image": "$applied_post.image",
                                "description": "$applied_post.desription",
                                "campaign_name": "$name",
                                "start_date": "$start_date",
                                "no_of_likes": "$campaign_post.no_of_likes",
                                "no_of_comments": "$campaign_post.no_of_comments",
                                "no_of_shares": "$campaign_post.no_of_shares",
                                "social_media_platform": "$campaign_post.social_media_platform",
                                "user_id": "$campaign_post.user_id"
                            }
                        }
                    ]
                }
            },
            { "$unwind": "$applied_post" },
            { "$replaceRoot": { "newRoot": "$applied_post" } },
            {
                "$match": filter
            },
            { "$sort": sort },
            {
                "$lookup": {
                    "from": "users",
                    "foreignField": "_id",
                    "localField": "user_id",
                    "as": "user"
                }
            },
            {
                "$unwind": "$user"
            },
            {
                "$group": {
                    "_id": 1,
                    "total": { "$sum": 1 },
                    "posts": { "$push": "$$ROOT" }
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "total": 1,
                    "posts": { "$slice": ["$posts", page_size * (page_no - 1), page_size] }
                }
            }
        ];

        var posts = await Campaign_post.aggregate(aggregate);

        if (posts && posts[0]) {
            return { "status": 1, "message": "Post found", "posts": posts[0] };
        } else {
            return { "status": 2, "message": "No post found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while getting data", "error": err };
    }
}

module.exports = campaign_helper;