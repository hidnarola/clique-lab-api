var mongoose = require('mongoose');

var Campaign_Applied = require("./../models/Campaign_applied");
var Campaign_User = require("./../models/Campaign_user");
var Campaign = require("./../models/Campaign");
var ObjectId = mongoose.Types.ObjectId;

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
        console.log("user_id = ",id);
       console.log("filter = ", filter);
       console.log("page_no = ", page_no);
       console.log("page_size = ", page_size);
       
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
                $limit : page_size

            }
            /*{
                $sort: {price : sort} 
            },*/

        ]
        )

        console.log("campaign = ",campaigns);
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
campaign_helper.get_all_campaign = async (filter, sort, page_no, page_size) => {
    try {
        var campaign = await Campaign
            .find(filter)
            .sort(sort)
            .skip(page_no > 0 ? ((page_no - 1) * page_size) : 0).limit(page_size);
        if (campaign.length > 0 && campaign) {
            return { "status": 1, "message": "campaign found", "Campaign": campaign };
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

campaign_helper.get_campaign_by_id = async (campaign_id) => {
    try {
        var campaign = await Campaign.find({ _id: campaign_id });
        if (campaign) {
            return { "status": 1, "message": "campaign found", "Campaign": campaign };
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
        return { "status": 1, "message": "Campaign inserted", "campaign": campaign_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting Campaign Applied", "error": err };
    }
};

/*
 * insert_campaign is used to insert into campaign collection
 * 
 * @param   campaign_object     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting campaign, with error
 *          status  1 - If campaign inserted, with inserted faculty's document and appropriate message
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
campaign_helper.get_all_offered_campaign = async (id,filter, sort, page_no, page_size) => {
    try {
        var campaigns = await Campaign.aggregate([
            {
                $lookup:
                    {
                        from: "campaign_invite",
                        localField: "_id",
                        foreignField: "campaign_id",
                        as: "offered_campaign"
                    }
            },
            {
                $unwind: "$offered_campaign"
            },
            {
                $match:
                    {
                        "offered_campaign.user_id": { "$eq": new ObjectId(id) },
                        "status": true
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
                $limit : page_size

            }

        ])

        if (campaigns && campaigns.length > 0) {
            return { "status": 1, "message": "campaign found", "campaign": campaigns };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {

        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}

module.exports = campaign_helper;