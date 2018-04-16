var Education = require("./../models/Education");
var education_helper = {};
/*
 * get_all_education is used to fetch all education data
 * 
 * @return  status 0 - If any internal error occured while fetching education data, with error
 *          status 1 - If education data found, with education object
 *          status 2 - If education not found, with appropriate message
 */
education_helper.get_all_education = async () => {
    try {
        var education = await Education.find({},{"name":1});
        if (education ) {
            return { "status": 1, "message": "Education found", "education": education };
        } else {
            return { "status": 2, "message": "No Education available" };   
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Education", "error": err }
    }
}

module.exports = education_helper;