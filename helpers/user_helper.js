var User = require("./../models/User");
var user_helper = {};


/*
 * get_login_by_email is used to fetch single promoter by email address
 * 
 * @param   email   Specify email address of promoter
 * 
 * @return  status  0 - If any error occur in finding promoter, with error
 *          status  1 - If Promoter found, with found promoter document
 *          status  2 - If Promoter not found, with appropriate error message
 * 
 * @developed by "ar"
 */
user_helper.get_login_by_email = async (email) => {
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
 * get_all_user is used to get all user
 * 
 * @return  status 0 - If any internal error occured while fetching user data, with error
 *          status 1 - If user data found, with user's documents
 *          status 2 - If user not found, with appropriate message
 */
user_helper.get_all_user = async () => {
    try {
        var users = await User.find({ status: true }, { "name": 1, "username": 1, "avatar": 1, "facebook": 1, "instagram": 1, "twitter": 1, "pinterest": 1, "linkedin": 1 });
        if (users && users.length > 0) {
            return { "status": 1, "message": "Users found", "users": users };
        } else {
            return { "status": 2, "message": "No user found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Brand", "error": err }
    }
};

/*
 * get_filtered_user is used to get user based on given filter
 * 
 * @param   
 * 
 * @return  status 0 - If any internal error occured while fetching user data, with error
 *          status 1 - If user data found, with user's documents
 *          status 2 - If user not found, with appropriate message
 */
user_helper.get_filtered_user = async (page_no, page_size, filter) => {
    try {
        var aggregate = [];
        if (filter) {
            aggregate.push({ "$match": filter });
        }

        aggregate.push({ "$skip": page_size * (page_no - 1) });
        aggregate.push({ "$limit": page_size });

        console.log("aggregate = ", aggregate);

        var users = await User.aggregate(aggregate);
        // var users = await User.find({status:true},{"name":1,"username":1,"avatar":1,"facebook":1,"instagram":1,"twitter":1,"pinterest":1,"linkedin":1});
        if (users && users.length > 0) {
            return { "status": 1, "message": "Users found", "users": users };
        } else {
            return { "status": 2, "message": "No user found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Brand", "error": err }
    }
};

/*
 * update_user_by_id is used to update User data based on user_id
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
user_helper.update_user_by_id = async (user_id, login_object) => {
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


module.exports = user_helper;