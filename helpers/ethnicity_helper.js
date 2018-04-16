var Ethnicity = require("./../models/Ethnicity");
var ethnicity_helper = {};
/*
 * get_all_ethnicity is used to fetch all ethnicity data
 * 
 * @return  status 0 - If any internal error occured while fetching ethnicity data, with error
 *          status 1 - If ethnicity data found, with ethnicity object
 *          status 2 - If ethnicity not found, with appropriate message
 */
ethnicity_helper.get_all_ethnicity = async () => {
    try {
        var ethnicity = await Ethnicity.find({},{"ethnicity":1});
        if (ethnicity ) {
            return { "status": 1, "message": "Ethnicity found", "ethnicity": ethnicity };
        } else {
            return { "status": 2, "message": "No Ethnicity available" };   
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Ethnicity", "error": err }
    }
}

module.exports = ethnicity_helper;