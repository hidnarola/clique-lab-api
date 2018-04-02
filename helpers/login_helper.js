var User = require("./../models/User");
var login_helper = {};

/*
 * get_promoter_by_email is used to fetch single promoter by email address
 * 
 * @param   email   Specify email address of promoter
 * 
 * @return  status  0 - If any error occur in finding promoter, with error
 *          status  1 - If Promoter found, with found promoter document
 *          status  2 - If Promoter not found, with appropriate error message
 * 
 * @developed by "ar"
 */
login_helper.get_login_by_email = async (email) => {
    try {
        var user = await User.findOne({ "email": email });
        if (user) {
            return { "status": 1, "message": "User details found", "user": user };
        } else {
            return { "status": 2, "message": "User not found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding user", "error": err }
    }
};



/*
 * update_by_id is used to update User data based on user_id
 * 
 * @param   user_id         String  _id of promoter that need to be update
 * @param   user_object     JSON    object consist of all property that need to update
 * 
 * @return  status  0 - If any error occur in updating user, with error
 *          status  1 - If User updated successfully, with appropriate message
 *          status  2 - If User not updated, with appropriate message
 * 
 * @developed by "ar"
 */
login_helper = async (user_id, login_object) => {
    try {
        let user = await User.findOneAndUpdate({ _id: user_id }, login_object);
        if (!user) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated", "user": user };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while updating user", "error": err }
    }
};

   module.exports = login_helper;