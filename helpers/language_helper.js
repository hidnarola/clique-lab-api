var Language = require("./../models/Language");
var language_helper = {};
/*
 * get_all_language is used to fetch all language data
 * 
 * @return  status 0 - If any internal error occured while fetching language data, with error
 *          status 1 - If language data found, with language object
 *          status 2 - If language not found, with appropriate message
 */
language_helper.get_all_language = async () => {
    try {
        var language = await Language.find({},{"name":1,"short_name":1});
        if (language ) {
            return { "status": 1, "message": "Language found", "language": language };
        } else {
            return { "status": 2, "message": "No Language available" };   
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Language", "error": err }
    }
}

module.exports = language_helper;