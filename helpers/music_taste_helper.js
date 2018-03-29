var Music_taste = require("./../models/Music_taste");
var music_taste_helper = {};
/*
 * get_all_interest is used to fetch all interest data
 * 
 * @return  status 0 - If any internal error occured while fetching interest data, with error
 *          status 1 - If interest data found, with interest object
 *          status 2 - If interest not found, with appropriate message
 */
music_taste_helper.get_all_music_taste = async () => {
    try {
        var music_taste = await Music_taste.find();
        if (music_taste) {
            return { "status": 1, "message": "Music taste found", "Music Taste": music_taste };
        } else {
            return { "status": 2, "message": "Music taste available" };   
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Music taste", "error": err }
    }
}
module.exports = music_taste_helper;