var mongoose = require('mongoose');

var Campaign_post = require("./../models/Campaign_post");
var Campaign = require("./../models/Campaign");
var Transaction = require("./../models/Transaction");

var social_helper = require("./../helpers/social_helper");

var ObjectId = mongoose.Types.ObjectId;
var campaign_post_helper = {};

/*
 * get_all_post is used to get all post
 * 
 * @return  status 0 - If any internal error occured while fetching post data, with error
 *          status 1 - If post data found, with post's documents
 *          status 2 - If post not found, with appropriate message
 */
campaign_post_helper.get_all_post = async () => {
    try {
        var posts = await Campaign_post.find({}).populate('user_id').lean();
        if (posts && posts.length > 0) {
            return { "status": 1, "message": "Post found", "posts": posts };
        } else {
            return { "status": 2, "message": "No post found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Post", "error": err }
    }
};

/*
 * insert_campaign is used to insert into campaign collection
 * 
 * @param   campaign_object     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting campaign, with error
 *          status  1 - If campaign inserted, with inserted faculty's document and appropriate message
 * 
 * @developed by "mm"
 */
campaign_post_helper.insert_campaign_post = async (obj) => {

    let campaign = new Campaign_post(obj);
    try {
        let campaign_data = await campaign.save();
        return { "status": 1, "message": "Campaign post inserted", "campaign": campaign_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting campaign post", "error": err };
    }
};

campaign_post_helper.update_campaign_post = async (id,obj) => {
    try {
        let post = await Campaign_post.findOneAndUpdate({ _id: id }, obj);
        if (!post) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while updating post", "error": err }
    }
}

/**
 * return count of total purchased post by promoter
 * 
 * @param {*} promoter_id 
 * @param {*} filter 
 * 
 * Developed by "ar"
 */
campaign_post_helper.count_purchase_post_by_promoter = async (promoter_id, filter) => {
    var aggregate = [
        {
            "$match": { "promoter_id": new ObjectId(promoter_id) }
        },
        {
            $lookup: {
                from: "campaign_user",
                localField: "_id",
                foreignField: "campaign_id",
                as: "campaign_user"
            }
        },
        {
            $unwind: "$campaign_user"
        },
        {
            "$match": {
                "campaign_user.is_purchase": true
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "campaign_user.user_id",
                "foreignField": "_id",
                "as": "user"
            }
        },
        {
            $unwind: "$user"
        }
    ];

    if (filter) {
        aggregate.push({ "$match": filter });
    }

    aggregate.push({
        "$group": {
            "_id": null,
            "purchase_post": { "$sum": 1 },
        }
    });

    let result = await Campaign.aggregate(aggregate);
    if (result && result[0] && result[0].purchase_post) {
        return result[0].purchase_post;
    } else {
        return 0;
    }
};

campaign_post_helper.total_spent_by_promoter = async (promoter_id, filter) => {

    var total_spent = [
        {
            "$match": {
                "promoter_id": new ObjectId(promoter_id),
                "status": "paid"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "cart_items.user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },

    ];
    if (filter) {
        total_spent.push({ "$match": filter });
    }
    total_spent.push({
        $group: {
            "_id": null,
            "total": { $sum: "$total_amount" }
        }
    });

    var result = await Transaction.aggregate(total_spent);
    if (result && result[0] && result[0].total) {
        return result[0].total;
    } else {
        return 0;
    }
};

campaign_post_helper.find_post_statistics_by_post = async(post) => {
    var obj = {
        "no_of_likes":post.no_of_likes,
        "no_of_comments":post.no_of_comments,
        "no_of_shares":post.no_of_shares
    };
    // Check appropriate social media and get like count
    if(post && post.user_id){
        if(post.social_media_platform === "facebook" && post.user_id.facebook.access_token){
            var like_resp = await social_helper.get_facebook_post_statistics(post.post_id,post.user_id.facebook.access_token);
            if(like_resp.status === 1){
                obj.no_of_likes = like_resp.likes;
                obj.no_of_comments = like_resp.comments;
                obj.no_of_shares = like_resp.shares;
            }
            campaign_post_helper.update_campaign_post(post._id,obj);
        } else if(post.social_media_platform === "pinterest" && post.user_id.pinterest.access_token){
            var like_resp = await social_helper.get_pinterest_post_statistics(post.post_id,post.user_id.pinterest.access_token);
            
        }  else if(post.social_media_platform === "linkedin"){
    
        }  else if(post.social_media_platform === "twitter"){
    
        }
    }  
};

module.exports = campaign_post_helper;
