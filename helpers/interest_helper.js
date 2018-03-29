var Interest = require("./../models/User_interest");
var interest_helper = {};
/*
 * get_all_exercise is used to fetch all exercise data
 * 
 * @return  status 0 - If any internal error occured while fetching exercise data, with error
 *          status 1 - If exercise data found, with exercise object
 *          status 2 - If exercise not found, with appropriate message
 */
interest_helper.get_all_interest = async () => {
    try {
        var interest = await Interest.find();
        if (interest) {
            return { "status": 1, "message": "Interest found", "Interest": interset };
        } else {
            return { "status": 2, "message": "No Interest available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Interest", "error": err }
    }
}
module.exports = interest_helper;