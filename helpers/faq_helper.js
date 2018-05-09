var faq = require("./../models/Faq");
var faq_helper = {};
/*
 * get_all_music_taste is used to fetch all music_taste data
 * 
 * @return  status 0 - If any internal error occured while fetching music_taste data, with error
 *          status 1 - If music_taste data found, with music_taste object
 *          status 2 - If music_taste not found, with appropriate message
 */
faq_helper.get_faqs = async () => {
    try {
        var faqs = await faq.find({ "status": true }, { "question": 1, "answer": 1 });
        if (faqs && faqs.length > 0) {
            return { "status": 1, "message": "Faqs found", "faqs": faqs };
        } else {
            return { "status": 2, "message": "Faqs not found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding countries", "error": err }
    }
}

module.exports = faq_helper;