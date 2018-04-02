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
 * @developed by "mansi"
 */
profile_helper.insert_profile = async (profile_object) => {
    let profile = new Profile(profile_object)
    try {
        let profile_data = await profile.save();
        return { "status": 1, "message": "Profile inserted", "promoter": profile_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting Profile", "error": err };
    }
};

/*
 * get_profile_by_id is used to fetch Profile for the user
 * 
 * @return  status 0 - If any internal error occured while fetching profile data, with error
 *          status 1 - If Profile data found, with profile object
 *          status 2 - If Profile not found, with appropriate message
 */
profile_helper.get_profile_by_id = async (id) => {
    try {
        var profile = await Profile.findOne({ _id: id }).lean();
        if (profile) {
            var power = profile.facebook.no_of_friends + profile.instagram.no_of_followers;
            profile.power = power;
            return { "status": 1, "message": "Profile found", "Profile": profile };

        } else {
            return { "status": 2, "message": "Profile available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Profile", "error": err }
    }
}


/*
 * update_by_id is used to update User data based on user_id
 * 
 * @param   user_id         String  _id of User that need to be update
 * @param   user_object     JSON    object consist of all property that need to update
 * 
 * @return  status  0 - If any error occur in updating user, with error
 *          status  1 - If User updated successfully, with appropriate message
 *          status  2 - If User not updated, with appropriate messag
 * 
 * @developed by "mansi"
 * */
profile_helper.update_by_id = async (id, login_object) => {
    try {
        let user = await Profile.findOneAndUpdate({ _id:id }, login_object);
        if (!user) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated", "user": user };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while updating user", "error": err }
    }
};
module.exports = profile_helper;