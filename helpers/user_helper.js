var moment = require("moment");
var _ = require("underscore");
var lo_ = require("lodash");
var user_helper = {};

var User = require("./../models/User");
var brand = require("./../models/Inspired_Brand_submit");
var Music_taste = require("./../models/Music_taste");
var User_interest = require("./../models/User_interest");
var Job_industry = require("./../models/Job_industry");
var language = require("./../models/Language");
var ethnicity = require("./../models/Ethnicity");
var job_title = require("./../models/Job_title");
var education = require("./../models/Education");
var Promoter = require("./../models/Promoter");

var social_helper = require("./social_helper");
var earning_helper = require("./earning_helper");
var notification_helper = require("./notification_helper");

/*
 * get_login_by_email is used to fetch single user by email address
 * 
 * @param   email   Specify email address of user
 * 
 * @return  status  0 - If any error occur in finding user, with error
 *          status  1 - If User found, with found user document
 *          status  2 - If User not found, with appropriate error message
 * 
 * @developed by "ar"
 */
user_helper.get_login_by_email = async (email) => {
    try {
        var user = await User.findOne({ "email": email }).lean();
        if (user) {
            return { "status": 1, "message": "User details found", "user": user };
        } else {
            return { "status": 2, "message": "User not found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding user", "error": err }
    }
};

/*
 * get_user_by_id is used to fetch User by id
 * 
 * @param id String Specify _id of user collection
 * 
 * @return  status 0 - If any internal error occured while fetching user data, with error
 *          status 1 - If User data found, with user object
 *          status 2 - If User not found, with appropriate message
 */
user_helper.get_user_by_id = async (id) => {
    try {
        var user = await User.findOne({ _id: id })
            .populate('music_taste', ['name'])
            .populate('job_industry', ['name'])
            .populate('user_interest', ['name'])
            .populate('language')
            .populate('ethnicity')
            .populate('education')
            .populate('job_title')
            .populate('country')
            .lean();

        // Find searchable value
        var field_need_counted = [
            "user_interest", "name", "email", "short_bio", "gender",
            "job_industry", "music_taste", "username", "education",
            "date_of_birth", "ethnicity", "job_title", "language",
            "relationship_status", "suburb", "country"];

        var count = 0;
        Object.keys(user).forEach(async (key) => {
            if (field_need_counted.indexOf(key) > -1) {
                count++;
            }
        });

        if (user.facebook.enable) {
            count++;
        }

        if (user.instagram.enable) {
            count++;
        }

        if (user.twitter.enable) {
            count++;
        }

        if (user.pinterest.enable) {
            count++;
        }

        if (user.linkedin.enable) {
            count++;
        }

        user.searchable = Math.ceil(100 * count / (field_need_counted.length + 5));

        // Find social power
        if (user) {

            user.power = 0;
            if (user.facebook.enable) {
                user.power += user.facebook.no_of_friends;
            }
            if (user.pinterset.enable) {
                user.power += user.pinterset.no_of_friends;
            }
            if (user.linkedin.enable) {
                user.power += user.linkedin.no_of_friends;
            }
            if (user.twitter.enable) {
                user.power += user.twitter.no_of_friends;
            }
            if (user.instagram.enable) {
                user.power += user.instagram.no_of_friends;
            }

            if (user.date_of_birth) {
                user.date_of_birth = moment(user.date_of_birth).format("D MMMM YYYY");
            }

            notification_count = await notification_helper.get_total_notification_for_user(id);

            return { "status": 1, "message": "User found", "User": user, "notification_count": notification_count };
        } else {
            return { "status": 2, "message": "User not available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding User", "error": err }
    }
}

/*
 * get_all_user is used to get all user
 * 
 * @return  status 0 - If any internal error occured while fetching user data, with error
 *          status 1 - If user data found, with user's documents
 *          status 2 - If user not found, with appropriate message
 */
user_helper.get_all_user = async () => {
    try {
        var users = await User.find({ status: true }, { "name": 1, "username": 1, "avatar": 1, "facebook": 1, "instagram": 1, "twitter": 1, "pinterest": 1, "linkedin": 1, "country": 1, "image": 1 }).lean();
        if (users && users.length > 0) {
            return { "status": 1, "message": "Users found", "users": users };
        } else {
            return { "status": 2, "message": "No user found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Brand", "error": err }
    }
};

/*
 * get_filtered_user is used to get user based on given filter
 * 
 * @param   page_no     Integer page number
 * @param   page_size   Integer Total number of record per page
 * @param   filter      Array   Filter conditions for aggregate
 * @param   sort        Array   Sorting criteria for aggregate
 * 
 * @return  status 0 - If any internal error occured while fetching user data, with error
 *          status 1 - If user data found, with user's documents
 *          status 2 - If user not found, with appropriate message
 */
user_helper.get_filtered_user = async (page_no, page_size, filter, sort) => {
    try {
        var aggregate = [];
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
                'results': { "$push": '$$ROOT' }
            }
        });

        if (page_size && page_no) {
            aggregate.push({
                "$project": {
                    "total": 1,
                    'users': { "$slice": ["$results", page_size * (page_no - 1), page_size] }
                }
            });
        } else {
            aggregate.push({
                "$project": {
                    "total": 1,
                    'users': "$results"
                }
            });
        }

        console.log("Aggregate ==> ", JSON.stringify(aggregate));
        var users = await User.aggregate(aggregate);
        console.log("\n\nData ==> ", users);

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
 * insert_user is used to insert into User collection
 * 
 * @param   user_object     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting user, with error
 *          status  1 - If user inserted, with inserted user's document and appropriate message
 * 
 * @developed by "mm"
 */
user_helper.insert_user = async (user_object) => {
    let user = new User(user_object)
    try {
        let user_data = await user.save();
        return { "status": 1, "message": "Record inserted", "user": user_data };
    } catch (err) {
        if (err.code === 11000) {
            return { "status": 0, "message": "This account is already exist" };
        } else {
            return { "status": 0, "message": "Error occured while inserting user", "error": err };
        }
    }
};

/*
 * update_user_by_id is used to update User data based on user_id
 * 
 * @param   user_id         String  _id of promoter that need to be update
 * @param   user_object     JSON    object consist of all property that need to update
 * 
 * @return  status  0 - If any error occur in updating user, with error
 *          status  1 - If User updated successfully, with appropriate message
 *          status  2 - If User not updated, with appropriate message
 * 
 * @developed by "ar"
 */
user_helper.update_user_by_id = async (user_id, login_object) => {
    try {
        let user = await User.findOneAndUpdate({ _id: user_id }, login_object);
        if (!user) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated", "user": user };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while updating user", "error": err }
    }
};

/*
 * user_helper is used to fetch all bank detail
 * 
 * @return  status 0 - If any internal error occured while fetching bank detail , with error
 *          status 1 - If bank detail  found, with bank object
 *          status 2 - If bank detail not found, with appropriate message
 */
user_helper.get_bank_detail = async (user_id) => {
    try {
        var user = await User.findOne({ _id: user_id }, { "bank.bank_name": 1, "bank.account_name": 1, "bank.account_number": 1, "bank.bsb": 1 });
        if (user) {
            return { "status": 1, "message": "bank detail", "bank": user.bank };
        } else {
            return { "status": 2, "message": "No bank Detail available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding bank Detail", "error": err }
    }
}

/*
 * update_by_id is used to update User data based on user_id
 * 
 * @param   user_id         String  _id of promoter that need to be update
 * @param   user_object     JSON    object consist of all property that need to update
 * 
 * @return  status  0 - If any error occur in updating user, with error
 *          status  1 - If User updated successfully, with appropriate message
 *          status  2 - If User not updated, with appropriate message
 * 
 * @developed by "mm"
 */
user_helper.bank_detail_update = async (user_id, bank_id, bank) => {
    try {
        let user = await User.findOneAndUpdate(
            { "_id": user_id, "bank._id": bank_id },

            {
                "$set": {
                    "bank.$.bank_name": bank.bank_name,
                    "bank.$.account_number": bank.account_number,
                    "bank.$.account_name": bank.account_name,
                    "bank.$.bsb": bank.bsb
                }
            },

        );
        if (!user) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated", "user": user };
        }
    } catch (err) {
        console.log(err);
        return { "status": 0, "message": "Error occured while updating user", "error": err }

    }
};

/*
 * add_bank_to_user is used to insert into User collection
 * 
 * @param   bank     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting bank detail, with error
 *          status  1 - If bank detail inserted, with inserted bank detail's document and appropriate message
 * 
 * @developed by "mm"
 */

user_helper.add_bank_to_user = async (user_id, bank) => {
    try {
        let user = await User.findOneAndUpdate({ _id: user_id }, { $push: { "bank": bank } }, { new: true });
        if (!user) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated", "user": user };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while updating user", "error": err }
    }
};

user_helper.update_social_connection = async (user_id) => {
    let user_resp = await user_helper.get_user_by_id(user_id);

    if (user_resp.status === 1 && user_resp.User) {
        console.log("\n\n\n========================\nUpdating for user ==> ", user_resp.User.name);
        let user_friends = {};

        // Update facebook friends
        if (user_resp.User.facebook) {
            console.log("Updating facebbok friend of => ", user_resp.User.name);
            user_friends.facebook = user_resp.User.facebook;
            if (user_friends.facebook.no_of_friends) {
                user_friends.facebook.no_of_friends = 0;
            }

            if (user_resp.User.facebook.access_token) {
                console.log("fb token available");
                user_friends.facebook.no_of_friends = await social_helper.get_facebook_friends_by_token(user_resp.User.facebook.access_token);
            }

        } else {
            user_friends.facebook = {
                "no_of_friends": 0
            };
        }

        // Update instagram friends
        /*
        if (user_resp.User.instagram) {

            user_friends.instagram = user_resp.User.instagram;
            if (user_friends.instagram.no_of_friends) {
                user_friends.instagram.no_of_friends = 0;
            }

            if (user_resp.User.instagram.access_token) {
                user_friends.instagram.no_of_friends = await social_helper.get_instagram_friends_by_token(user_resp.User.instagram.access_token);
            }

        } else {
            user_friends.instagram = {
                "no_of_friends": 0
            };
        }*/

        // Update twitter friends
        if (user_resp.User.twitter) {

            user_friends.twitter = user_resp.User.twitter;
            if (user_friends.twitter.no_of_friends) {
                user_friends.twitter.no_of_friends = 0;
            }

            if (user_resp.User.twitter.access_token) {
                user_friends.twitter.no_of_friends = await social_helper.get_twitter_friends_by_token(user_resp.User.twitter.access_token, user_resp.User.twitter.access_token_secret);
            }

        } else {
            user_friends.twitter = {
                "no_of_friends": 0
            };
        }

        // Update pinterest friends
        if (user_resp.User.pinterest) {
            console.log("pinterest ==> for user ", user_resp.User.name, " ===> ", user_resp.User.pinterest);
            user_friends.pinterest = user_resp.User.pinterest;
            if (user_friends.pinterest.no_of_friends) {
                user_friends.pinterest.no_of_friends = 0;
            }

            if (user_resp.User.pinterest.access_token) {
                user_friends.pinterest.no_of_friends = await social_helper.get_pinterest_friends_by_token(user_resp.User.pinterest.access_token);
            }

        } else {
            user_friends.pinterest = {
                "no_of_friends": 0
            };
        }

        // Update linkedin friends
        if (user_resp.User.linkedin) {

            user_friends.linkedin = user_resp.User.linkedin;
            if (user_friends.linkedin.no_of_friends) {
                user_friends.linkedin.no_of_friends = 0;
            }

            if (user_resp.User.linkedin.access_token) {
                user_friends.linkedin.no_of_friends = await social_helper.get_linkedin_friends_by_token(user_resp.User.linkedin.access_token);
            }

        } else {
            user_friends.linkedin = {
                "no_of_friends": 0
            };
        }

        // Update value in DB
        let update_resp = await user_helper.update_user_by_id(user_id, user_friends);
        if (update_resp.status === 1) {
            return { "status": 1, "message": "Social connection data updated" }
        } else {
            return { "status": 0, "message": "Error while updating social connection data" }
        }

    } else {
        return { "status": 2, "message": "User not found" };
    }
};

user_helper.add_device_token_for_user = async (user_id, device_token, device_platform) => {
    let user_resp = await user_helper.get_user_by_id(user_id);

    // Check token already exist or not
    if (user_resp.status === 1) {
        var token_obj = {
            "token": device_token,
            "platform": device_platform
        };
        if (user_resp.User.device_token && user_resp.User.device_token.length > 0 && _.findWhere(user_resp.User.device_token, token_obj)) {
            // Token already available
            return { "status": 2, "message": "Token already added" }
        } else {
            // Add token
            var updated_user = await User.findOneAndUpdate({ _id: user_id }, { $push: { "device_token": token_obj } }, { new: true });
            if (!updated_user) {
                return { "status": 2, "message": "Can't add token for user" };
            } else {
                return { "status": 1, "message": "Token has been added for user", "user": updated_user };
            }
        }
    } else {
        return { "status": 0, "message": "User not exist" }
    }
};

user_helper.remove_device_token_for_user = async (user_id, device_token, device_platform) => {
    let user_resp = await user_helper.get_user_by_id(user_id);

    // Check token already exist or not
    if (user_resp.status === 1) {
        var token_obj = {
            "token": device_token,
            "platform": device_platform
        };
        if (user_resp.User.device_token && user_resp.User.device_token.length > 0 && _.findWhere(user_resp.User.device_token, token_obj)) {
            // Token already available, remove it
            var updated_user = await User.findOneAndUpdate({ _id: user_id }, { $pull: { "device_token": token_obj } }, { new: true });
            if (!updated_user) {
                return { "status": 2, "message": "Can't remove token for user" };
            } else {
                return { "status": 1, "message": "Token has been removed form user", "user": updated_user };
            }
        } else {
            return { "status": 2, "message": "Token not available" };
        }
    } else {
        return { "status": 0, "message": "User not exist" }
    }
};

user_helper.find_fb_friends_ranking = async (user_id, page_no, page_size) => {

    let user_resp = await user_helper.get_user_by_id(user_id);
    console.log("user resp ==> ", user_resp);
    if (user_resp.status === 1 && user_resp.User) {
        let user_friends = {};

        // Update facebook friends
        if (user_resp.User.facebook) {
            if (user_resp.User.facebook.access_token) {
                let friends = await social_helper.get_facebook_friend_details_by_token(user_resp.User.facebook.access_token);
                let fb_ids = [];
                if (friends.status === 1 && friends.friends) {
                    fb_ids = friends.friends.map((data) => {
                        return data.id;
                    });
                    let rank = await earning_helper.get_earning_of_users_by_fb_ids(fb_ids, page_no, page_size);
                    if (rank.status == 1) {
                        return { "status": 1, "message": "Rank found", "results": rank.ranking }
                    } else if (rank.status == 2) {
                        return { "status": 0, "message": "No rank data found" }
                    } else {
                        return { "status": 0, "message": "Error in finding ranking data" }
                    }
                } else {
                    return { "status": 0, "message": "No rank data found" }
                }
            } else {
                return { "status": 0, "message": "No rank data found" }
            }
        } else {
            return { "status": 0, "message": "No rank data found" }
        }
    } else {
        return { "status": 2, "message": "User not found" };
    }
};

user_helper.get_all_users_promoters = async (page_no, page_size, filter, sort) => {
    try {
        var aggregate = [
            { "$limit": 1 },
            {
                "$facet": {
                    "users": [
                        {
                            "$lookup": {
                                "from": "users",
                                "pipeline": [
                                    { "$match": { "removed": false } },
                                    {
                                        "$project": {
                                            "_id": 1,
                                            "name": 1,
                                            "sortname":{ "$toLower": "$name" },
                                            "status": 1,
                                            "email": 1,
                                            "created_at": 1,
                                            "type": "user"
                                        }
                                    }
                                ],
                                "as": "users"
                            }
                        },
                        { "$project": { "users": 1, "_id": 0 } },
                        { "$unwind": "$users" },
                        { "$replaceRoot": { "newRoot": "$users" } }
                    ],
                    "promoters": [
                        {
                            "$lookup": {
                                "from": "promoters",
                                "pipeline": [
                                    { "$match": { "removed": false } },
                                    {
                                        "$project": {
                                            "_id": 1,
                                            "name": "$full_name",
                                            "sortname":{ "$toLower": "$full_name" },
                                            "status": 1,
                                            "email": 1,
                                            "created_at": 1,
                                            "type": "promoter"
                                        }
                                    }
                                ],
                                "as": "promoters"
                            }
                        },
                        { "$project": { "promoters": 1, "_id": 0 } },
                        { "$unwind": "$promoters" },
                        { "$replaceRoot": { "newRoot": "$promoters" } }
                    ]
                }
            },
            {
                "$project": {
                    "data": {
                        "$concatArrays": ["$users", "$promoters"]
                    }
                }
            },
            { "$unwind": "$data" },
            { "$replaceRoot": { "newRoot": "$data" } },
            { "$match": filter },
            { "$sort": sort },
            {
                "$group": {
                    "_id": null,
                    "total": { "$sum": 1 },
                    "users": { "$push": "$$ROOT" }
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "total": 1,
                    "users": { "$slice": ["$users", page_size * (page_no - 1), page_size] }
                }
            }
        ];

        var users = await User.aggregate(aggregate);

        return { "status": 1, "message": "Users has been found", "users": users[0] }

    } catch (err) {
        console.log("err ==> ", err);
        return { "status": 0, "message": "Error occured while finding users", "error": err }
    }
};

module.exports = user_helper;