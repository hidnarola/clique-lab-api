var Suburb = require("./../models/User");
var suburb_helper = {};
/*
 * get_all_education is used to fetch all education data
 * 
 * @return  status 0 - If any internal error occured while fetching education data, with error
 *          status 1 - If education data found, with education object
 *          status 2 - If education not found, with appropriate message
 */
suburb_helper.get_all_suburb = async () => {
    try {
        var suburb  = await Suburb.find({},{"suburb ":1});
        if (education ) {
            return { "status": 1, "message": "Suburb found", "suburb": suburb };
        } else {
            return { "status": 2, "message": "No suburb available" };   
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding suburb", "error": err }
    }
}

module.exports = suburb_helper;