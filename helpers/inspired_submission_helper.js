var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var Inspire_submission = require("./../models/Inspired_Brand_submit");
var submission_helper = {};

/**
 * Get inspired submission by filter based on user info
 */
submission_helper.get_filtered_submission_for_promoter = async (promoter_id, page_no, page_size, filter, sort) => {
    try {

        var aggregate = [
            {
                "$match": {
                    "brand_id": new ObjectId(promoter_id)
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "users"
                }
            },
            {
                "$unwind": "users"
            }
        ];

        if (filter) {
            aggregate.push({ "$match": filter });
        }
        if (sort) {
            aggregate.push({ "$sort": sort });
        }

        console.log("aggregate = ",JSON.stringify(aggregate));

        var submissions = await Inspire_submission.aggregate(aggregate);

        if (submissions) {
            // _.map(campaigns[0].campaigns, function (campaign) {
            //     campaign.remaining_days = moment(campaign.end_date).diff(moment(), 'days');
            //     return campaign;
            // });
            return { "status": 1, "message": "Post found", "submissions": submissions };
        } else {
            return { "status": 2, "message": "No post available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding post", "error": err }
    }
};

/*
 * get_promoter_by_id is used to fetch promoter details by promoter id
 * 
 * @params  promoter_id     _id field of promoter collection
 * 
 * @return  status 0 - If any internal error occured while fetching promoter data, with error
 *          status 1 - If promoter data found, with promoter object
 *          status 2 - If promoter not found, with appropriate message
 */
submission_helper.insert_inspired_brand = async (promoter_object) => {
    let promoter = new Inspire_submission(promoter_object);
    try {
        let promoter_data = await promoter.save();
        return { "status": 1, "message": "Brand inserted", "brand": promoter_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while Brand ", "error": err };
    }
};

module.exports = submission_helper;