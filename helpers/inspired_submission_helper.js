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
                    "from": "campaign_user",
                    "localField": "_id",
                    "foreignField": "inspired_post_id",
                    "as": "inspired_post"
                }
            },
            {
                "$unwind": "$inspired_post"
            },
            {
                "$match":{
                    "inspired_post.is_purchase":false
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
                "$unwind": "$users"
            },
            {
                "$match":{
                    "users.status":true,
                    "users.removed":false
                }
            }
        ];

        if (filter) {
            aggregate.push({ "$match": filter });
        }
        if (sort) {
            aggregate.push({ "$sort": sort });
        }

        aggregate.push({
            "$group": {
                "_id": null,
                "total": { "$sum": 1 },
                'posts': { "$push": '$$ROOT' }
            }
        });

        if (page_size && page_no) {
            aggregate.push({
                "$project": {
                    "total": 1,
                    'posts': { "$slice": ["$posts", page_size * (page_no - 1), page_size] }
                }
            });
        } else {
            aggregate.push({
                "$project": {
                    "total": 1,
                    'posts': "$$ROOT"
                }
            });
        }

        var submissions = await Inspire_submission.aggregate(aggregate);
        submissions = await Inspire_submission.populate(submissions,{"path":"posts.users.country","model":"country"});

        if (submissions && submissions[0].posts && submissions[0].posts.length > 0) {
            return { "status": 1, "message": "Post found", "submissions": submissions[0] };
        } else {
            return { "status": 2, "message": "No post available" };
        }
    } catch (err) {
        console.log("Error = ", err);
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

submission_helper.get_inspired_post_by_id = async (post_id) => {
    try {
        var post = await Inspire_submission.findOne({ _id: post_id }).lean();
        if (post) {
            return { "status": 1, "message": "Post found", "post": post };
        } else {
            return { "status": 2, "message": "No post available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding post", "error": err }
    }
}

module.exports = submission_helper;