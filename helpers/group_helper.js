var Group = require("./../models/Group");
var Group_User = require("./../models/Group_user");
var group_helper = {};

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

        aggregate.push({"$group":{
            "_id":null,
            "total":{"$sum":1},
            'results':{"$push":'$$ROOT'}
        }});

        aggregate.push({"$project":{
            "total":1,
            'groups':{"$slice":["$results",page_size * (page_no - 1),page_size]}
        }});

        // aggregate.push({ "$skip": page_size * (page_no - 1) });
        // aggregate.push({ "$limit": page_size });

        console.log("aggregate = ", aggregate);
        var groups = await Group.aggregate(aggregate);

        if (groups && groups[0] && groups[0].groups.length > 0) {
            return { "status": 1, "message": "Groups found", "results": groups[0] };
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

module.exports = group_helper;