var Profile = require("./../models/User");
var profile_helper = {};



/*
 * insert_profile is used to insert into User collection
 * 
 * @param   profile_object     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting profile, with error
 *          status  1 - If profile inserted, with inserted profile's document and appropriate message
 * 
 * @developed by "ar"
 */
profile_helper.insert_profile = async (profile_object) => {
    let profile = new Profile(profile_object)
    try{
        let profile_data = await profile.save();
        return { "status": 1, "message": "Profile inserted", "promoter": profile_data };
    } catch(err){
        return { "status": 0, "message":"Error occured while inserting Profile","error": err };
    }
};

module.exports = profile_helper;