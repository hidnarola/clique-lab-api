var mongoose = require('mongoose');

var Campaign = require("./../models/Campaign_post");
var ObjectId = mongoose.Types.ObjectId;
var Campaign_User = require("./../models/Campaign_user");
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
campaign_post_helper.insert_campaign_post = async (campaign_object) => {
   
    let campaign = new Campaign(campaign_object);
    try {
        let campaign_data = await campaign.save();
        return { "status": 1, "message": "Campaign post inserted", "campaign": campaign_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting campaign post", "error": err };
    }
};



module.exports = campaign_post_helper;
