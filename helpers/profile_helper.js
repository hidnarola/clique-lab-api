var Profile = require("./../models/User");
var profile_helper = {};





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
 * @developed by "mm"
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