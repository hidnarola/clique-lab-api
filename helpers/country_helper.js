var country = require("./../models/Country");
var country_helper = {};
/*
 * get_all_music_taste is used to fetch all music_taste data
 * 
 * @return  status 0 - If any internal error occured while fetching music_taste data, with error
 *          status 1 - If music_taste data found, with music_taste object
 *          status 2 - If music_taste not found, with appropriate message
 */
country_helper.get_all_country= async () => {
    try {
        var countries = await country.find({"status" : true},{"name":1}).sort("name");
        if (countries && countries.length > 0) {
            return { "status": 1, "message": "countries found", "countries": countries};
        } else {
            return { "status": 2, "message": "countries not found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding countries", "error": err }
    }
}

module.exports = country_helper;