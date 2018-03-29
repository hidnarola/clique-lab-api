var Interest = require("./../models/User_interest");
var interest_helper = {};
/*
 * get_all_interest is used to fetch all interest data
 * 
 * @return  status 0 - If any internal error occured while fetching interest data, with error
 *          status 1 - If interest data found, with interest object
 *          status 2 - If interest not found, with appropriate message
 */
interest_helper.get_all_interest = async () => {
    try {
        var interest = await Interest.find();
        if (interest) {
            return { "status": 1, "message": "Interest found", "Interest": interest };
        } else {
            return { "status": 2, "message": "No Interest available" };   
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Interest", "error": err }
    }
}
module.exports = interest_helper;