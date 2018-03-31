var Campaign = require("./../models/Campaign");
var campaign_helper = {};
/*
 * get_campaign_by_id is used to fetch all interest data
 * 
 * @return  status 0 - If any internal error occured while fetching interest data, with error
 *          status 1 - If interest data found, with interest object
 *          status 2 - If interest not found, with appropriate message
 */
campaign_helper.get_capmpaign_by_user_id = async (user_id) => {
    try {
        console.log("1");
       var campaigns=  Campaign.aggregate([
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
                        { campaign_id: { $eq: 'user_id' } }, 
                    ]                   
                } 
                
            },
        ])
        console.log(campaigns);
        console.log("2");
        //var campaign = awaconsole.log()
        if (campaign) {
            console.log("3");
            return { "status": 1, "message": "campaign found", "campaign": campaign };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}


/*
 * interest_helper is used to fetch all capaign data
 * 
 * @return  status 0 - If any internal error occured while fetching campaign data, with error
 *          status 1 - If campaign data found, with campaign object
 *          status 2 - If campaign not found, with appropriate message
 */
campaign_helper.get_all_campaign = async () => {
    try {
        var campaign = await Campaign.find();
        if (campaign) {
            return { "status": 1, "message": "campaign found", "Interest": campaign };
        } else {
            return { "status": 2, "message": "No campaign available" };   
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}
module.exports = campaign_helper;