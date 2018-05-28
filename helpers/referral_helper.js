var mongoose = require('mongoose');

var Referral = require("./../models/Referral");
var referral_helper = {};

var ObjectId = mongoose.Types.ObjectId;

referral_helper.insert_referral = async (referral_object) => {
    let referral = new Referral(referral_object)
    try {
        let referral_data = await referral.save();
        return { "status": 1, "message": "Referral has been inserted", "referral": referral_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting referral", "error": err };
    }
};

referral_helper.get_joined_referral_by_promoter = async(promoter_id,filter) => {
    try{
        let referral = await Referral.aggregate([
            {
                "$match":{
                    "promoter_id":new ObjectId(promoter_id)
                }
            },
            {
                "$match":filter
            },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, count: { $sum: 1 } } },
        ]);

        return {"status":1,"message":"Referral data found","referral":referral};

    } catch(err){
        return {"status":0,"message":"Error has occured while finding joined referral","error":err};
    }
}

referral_helper.get_referral_revenue_by_promoter = async(promoter_id,filter) => {
    try{
        let referral = await Referral.aggregate([
            {
                "$match":{
                    "promoter_id":new ObjectId(promoter_id)
                }
            },
            {
                "$match":filter
            },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, revenue: { $sum: "$reward_amount" } } },
        ]);

        return {"status":1,"message":"Referral data found","revenue":referral};

    } catch(err){
        return {"status":0,"message":"Error has occured while finding joined referral","error":err};
    }
}

module.exports = referral_helper;