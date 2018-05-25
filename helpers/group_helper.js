var mongoose = require('mongoose');

var Group = require("./../models/Group");
var Group_User = require("./../models/Group_user");
var group_helper = {};

var ObjectId = mongoose.Types.ObjectId;

/*
 * get_group_by_id is used to fetch group details by group id
 * 
 * @params  group_id     _id field of group collection
 * 
 * @return  status 0 - If any internal error occured while fetching group data, with error
 *          status 1 - If group data found, with group object
 *          status 2 - If group not found, with appropriate message
 * 
 * @developed by "ar"
 */
group_helper.get_group_by_id = async (group_id) => {
    try {
        var group = await Group.findOne({ "_id": { "$eq": group_id } });
        if (group) {
            return { "status": 1, "message": "Group details found", "group": group };
        } else {
            return { "status": 2, "message": "Group not found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding group", "error": err }
    }
};

/*
 * insert_group is used to insert into group collection
 * 
 * @param   group_object     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting group, with error
 *          status  1 - If group inserted, with inserted group's document and appropriate message
 * 
 * @developed by "ar"
 */
group_helper.insert_group = async (group_object) => {
    let group = new Group(group_object)
    try {
        let group_data = await group.save();
        return { "status": 1, "message": "Group has been inserted", "group": group_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting group", "error": err };
    }
};

/*
 * get_filtered_group is used to get group based on given filter
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
group_helper.get_filtered_group = async (page_no, page_size, filter, sort) => {
    try {
        var aggregate = [];
        if (filter) {
            aggregate.push({ "$match": filter });
        }
        if (sort) {
            aggregate.push({ "$sort": sort });
        }

        // aggregate.push({
        //     "$lookup":{
        //         "from":""
        //     }
        // });

        if (page_size && page_no) {
            aggregate.push({
                "$group": {
                    "_id": null,
                    "total": { "$sum": 1 },
                    'results': { "$push": '$$ROOT' }
                }
            });
            aggregate.push({
                "$project": {
                    "total": 1,
                    'groups': { "$slice": ["$results", page_size * (page_no - 1), page_size] }
                }
            });
        }

        aggregate = aggregate.concat([
            {
                "$unwind": "$groups"
            },
            {
                "$lookup": {
                    "from": "group_user",
                    "foreignField": "group_id",
                    "localField": "groups._id",
                    "as": "groups.user"
                }
            },
            {
                "$group": {
                    "_id": null,
                    "total": { "$first": "$total" },
                    "groups": { "$push": "$groups" }
                }
            }
        ])

        console.log("aggregate ===> ", JSON.stringify(aggregate));

        var groups = await Group.aggregate(aggregate);

        groups = await Group.populate(groups, { "path": "groups.user.user_id", "model": "users" });

        if (groups && groups[0]) {
            if (page_no && page_size) {
                // console.log("------------> Type ====>   ",typeof groups[0]);
                // console.log(groups[0]);
                groups[0].groups = groups[0].groups.map((group) => {

                    group.total_member = 0;
                    group.social_power = 0;

                    // Count total memeber
                    if (group.user) {
                        group.total_member = group.user.length;
                        group.user.forEach(u => {
                            group.social_power += (u.user_id.facebook && u.user_id.facebook.no_of_friends) ? u.user_id.facebook.no_of_friends : 0;
                            group.social_power += (u.user_id.instagram && u.user_id.instagram.no_of_friends) ? u.user_id.instagram.no_of_friends : 0;
                            group.social_power += (u.user_id.twitter && u.user_id.twitter.no_of_friends) ? u.user_id.twitter.no_of_friends : 0;
                            group.social_power += (u.user_id.pinterest && u.user_id.pinterest.no_of_friends) ? u.user_id.pinterest.no_of_friends : 0;
                            group.social_power += (u.user_id.linkedin && u.user_id.linkedin.no_of_friends) ? u.user_id.linkedin.no_of_friends : 0;
                        });
                    }

                    delete group.user;
                    return group;
                });
                return { "status": 1, "message": "Groups found", "results": groups[0] };
            } else {
                return { "status": 1, "message": "Groups found", "results": groups };
            }
        } else {
            return { "status": 2, "message": "No group found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding group", "error": err }
    }
};

/*
 * insert_group_user is used to insert into Group_user collection
 * 
 * @param   group_user_object     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting group_user, with error
 *          status  1 - If group_user inserted, with inserted group_user's document and appropriate message
 * 
 * @developed by "ar"
 */
group_helper.insert_group_user = async (group_user_object) => {
    let group_user = new Group_User(group_user_object)
    try {
        let group_user_data = await group_user.save();
        return { "status": 1, "message": "User added in group", "group_user": group_user_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting into group_user", "error": err };
    }
};

group_helper.user_not_exist_group_for_promoter = async (user_id, promoter_id) => {
    try {
        var groups = await Group.aggregate([
            {
                "$match": { "promoter_id": new ObjectId(promoter_id) }
            },
            {
                "$lookup": {
                    "from": "group_user",
                    "localField": "_id",
                    "foreignField": "group_id",
                    "as": "group_user"
                }
            },
            {
                "$match": { "group_user.user_id": { $ne: new ObjectId(user_id) } }
            }
        ]);

        if (groups && groups.length > 0) {
            return { "status": 1, "message": "groups found", "groups": groups };
        } else {
            return { "status": 2, "message": "No group available" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding group", "error": err }
    }
}

group_helper.get_members_of_group = async (group_id, page_no, page_size, filter, sort) => {
    try {
        var aggregate = [{
            "$match": { "group_id": new ObjectId(group_id) }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "members"
            }
        },
        {
            "$unwind": "$members"
        }];

        // Apply additional filter
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
                'results': { "$push": '$members' }
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

        var members = await Group_User.aggregate(aggregate);

        if (members && members[0] && members[0].users.length > 0) {
            return { "status": 1, "message": "Members found", "results": members[0] };
        } else {
            return { "status": 2, "message": "No member found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding group member", "error": err }
    }
};

group_helper.insert_multiple_group_user = async (group_user_array) => {
    try {
        let group_user_data = await Group_User.insertMany(group_user_array, { ordered: false });
        return { "status": 1, "message": "User added in group", "group_user": group_user_data };
    } catch (err) {
        if (err.name == "BulkWriteError") {
            return { "status": 1, "message": "User added in group" };
        } else {
            return { "status": 0, "message": "Error occured while inserting into group_user", "error": err };
        }
    }
};

module.exports = group_helper;