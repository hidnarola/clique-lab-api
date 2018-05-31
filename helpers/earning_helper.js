var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

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


module.exports = earning_helper;