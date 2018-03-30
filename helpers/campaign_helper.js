var Campaign = require("./../models/User_interest");
var campaign_helper = {};
/*
 * get_campaign_by_id is used to fetch all interest data
 * 
 * @return  status 0 - If any internal error occured while fetching interest data, with error
 *          status 1 - If interest data found, with interest object
 *          status 2 - If interest not found, with appropriate message
 */
campaign_helper.get_user_id = async (id) => {
    try {
        var campaign = await Campaign.findOne({_id:id});
        if (campaign) {
            return { "status": 1, "message": "campaign found", "campaign": campaign };
        } else {
            return { "status": 2, "message": "No campaign available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding campaign", "error": err }
    }
}
module.exports = campaign_helper;