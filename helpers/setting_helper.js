var Setting = require("./../models/Settings");
var setting_helper = {};

/*
 * get_setting_by_id is used to fetch setting details by setting id
 * 
 * @params  setting_id     _id field of setting collection
 * 
 * @return  status 0 - If any internal error occured while fetching setting data, with error
 *          status 1 - If setting data found, with setting object
 *          status 2 - If setting not found, with appropriate message
 * 
 * @developed by "ar"
 */
setting_helper.get_setting_by_id = async (setting_id) => {
    try {
        var setting = await Setting.findOne({ "_id": { "$eq": setting_id } });
        if (setting) {
            return { "status": 1, "message": "Setting details found", "setting": setting };
        } else {
            return { "status": 2, "message": "Setting not found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding setting", "error": err }
    }
};

/*
 * get_setting_by_key is used to fetch setting details by setting key
 * 
 * @params  key key field of setting collection
 * 
 * @return  status 0 - If any internal error occured while fetching setting data, with error
 *          status 1 - If setting data found, with setting object
 *          status 2 - If setting not found, with appropriate message
 * 
 * @developed by "ar"
 */
setting_helper.get_setting_by_key = async (key) => {
    try {
        var setting = await Setting.findOne({ "key": key });
        if (setting) {
            return { "status": 1, "message": "Setting details found", "setting": setting };
        } else {
            return { "status": 2, "message": "Setting not found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding setting", "error": err }
    }
};

module.exports = setting_helper;