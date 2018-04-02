var Campaign_Applied = require("./../models/Campaign_applied");
var Campaign_User = require("./../models/Campaign_user");
var Campaign = require("./../models/Campaign");

var campaign_helper = {};
/*
 * get_campaign_by_id is used to fetch all campaign data
 * 
 * @return  status 0 - If any internal error occured while fetching campaign data, with error
 *          status 1 - If campaign data found, with campaign object
 *          status 2 - If campaign not found, with appropriate message
 */
campaign_helper.get_campaign_by_user_id = async (id) => {
    try {
       var campaigns=  Campaign_Applied.aggregate([
            { 
               $lookup: { 
                    from: "Campaign_applied",
                    localField: "_id",
                    foreignField: "campaign_id",
                    as: "Private_Campaign" 
                } 
            },+
            { 
                 $match: { 
                    $and: [
                        { campaign_id: { $eq: 'user_id' } }, 
                    ]                   
                }  
            },
        ])
    
        if (campaigns) {
            return { "status": 1, "message": "campaign found", "campaign": campaigns };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        console.log("7");
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
campaign_helper.get_all_campaign = async () => {
    try {
        var campaign = await Campaign.find();
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
 * get_campaign_by_id is used to fetch all campaign data
 * 
 * @return  status 0 - If any campaign error occured while fetching campaign data, with error
 *          status 1 - If campaign data found, with campaign object
 *          status 2 - If campaign not found, with appropriate message
 */
campaign_helper.get_all_approved_campaign = async (id) => {
    try {
       var campaigns=  Campaign_User.aggregate([
            { 
               $lookup: { 
                    from: "campaign_user",
                    localField: "_id",
                    foreignField: "campaign_id",
                    as: "Private_Campaign" 
                } 
            },
            { 
                 $match: { 
                    $and: [
                        { campaign_id: { $eq: 'user_id' } ,
                            status : 'true'}, 
                    ]                   
                }  
            },
        ])
    
        if (campaigns) {
            return { "status": 1, "message": "campaign found", "campaign": campaigns };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        console.log("7");
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}
module.exports = campaign_helper;