var Inspire_submission = require("./../models/Inspired_Brand_submit");
var submission_helper = {};

/**
 * Get inspired submission by filter based on user info
 */
submission_helper.get_filtered_submission = async (page_no, page_size, filter, sort) => {
    try {
        var aggregate = [];
        if (filter) {
            aggregate.push({ "$match": filter });
        }
        if (sort) {
            aggregate.push({ "$sort": sort });
        }

        aggregate.push({"$group":{
            "_id":null,
            "total":{"$sum":1},
            'results':{"$push":'$$ROOT'}
        }});

        if(page_size && page_no){
            aggregate.push({"$project":{
                "total":1,
                'users':{"$slice":["$results",page_size * (page_no - 1),page_size]}
            }});
        } else {
            aggregate.push({"$project":{
                "total":1,
                'users':"$results"
            }});
        }
        
        var users = await User.aggregate(aggregate);

        if (users && users[0] && users[0].users.length > 0) {
            return { "status": 1, "message": "Users found", "results": users[0] };
        } else {
            return { "status": 2, "message": "No user found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding user", "error": err }
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