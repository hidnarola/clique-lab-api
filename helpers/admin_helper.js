var Admin = require("./../models/Admin");
var admin_helper = {};

/*
 * get_admin_by_email_or_username is used to fetch single admin by email address
 * 
 * @param   email_or_username   Specify email address/username of admin
 * 
 * @return  status  0 - If any error occur in finding admin, with error
 *          status  1 - If admin found, with found admin document
 *          status  2 - If admin not found, with appropriate error message
 * 
 * @developed by "ar"
 */
admin_helper.get_admin_by_email_or_username = async (email_or_username) => {
    try {
        var admin = await Admin.findOne({ "$or": [{ "email": email_or_username }, { "username": email_or_username }] }).lean();
        if (admin) {
            return { "status": 1, "message": "Admin details found", "admin": admin };
        } else {
            return { "status": 2, "message": "Admin not found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding admin", "error": err }
    }
};

/*
 * update_admin_by_id is used to update admin data based on _id
 * 
 * @param   _id        String  _id of admin that need to be update
 * @param   object     JSON    object consist of all property that need to update
 * 
 * @return  status  0 - If any error occur in updating admin, with error
 *          status  1 - If admin updated successfully, with appropriate message
 *          status  2 - If admin not updated, with appropriate message
 * 
 * @developed by "ar"
 */
admin_helper.update_admin_by_id = async (_id, object) => {
    try {
        let admin = await Admin.findOneAndUpdate({ _id: _id }, object,{new:true});
        if (!admin) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated", "admin": admin };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while updating admin", "error": err }
    }
};

module.exports = admin_helper;