var Music_taste = require("./../models/Music_taste");
var music_taste_helper = {};
/*
 * get_all_music_taste is used to fetch all music_taste data
 * 
 * @return  status 0 - If any internal error occured while fetching music_taste data, with error
 *          status 1 - If music_taste data found, with music_taste object
 *          status 2 - If music_taste not found, with appropriate message
 */
music_taste_helper.get_all_music_taste = async () => {
    try {
        var music_taste = await Music_taste.find({},{"name":1});
        if (music_taste) {
            return { "status": 1, "message": "Music taste found", "music_taste": music_taste };
        } else {
            return { "status": 2, "message": "Music taste available" };   
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Music taste", "error": err }
    }
}
module.exports = music_taste_helper;