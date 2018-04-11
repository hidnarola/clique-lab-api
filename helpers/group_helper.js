var Group = require("./../models/Group");
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

module.exports = group_helper;