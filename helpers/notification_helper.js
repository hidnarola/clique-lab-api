var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var Notification = require("./../models/Notification");
var notification_helper = {};

/**
 * get_all_notification is used to fetch all notification data
 * 
 * @return  status 0 - If any internal error occured while fetching notification data, with error
 *          status 1 - If notification data found, with notification object
 *          status 2 - If notification not found, with appropriate message
 */
notification_helper.get_notification_for_user = async (user_id, page_no, page_size) => {
    try {
        let aggregate = [
            {
                "$match": {
                    "user_id": new ObjectId(user_id)
                }
            },
            {
                "$sort":{"created_at":-1}
            }
        ];

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
                    'notifications': { "$slice": ["$results", page_size * (page_no - 1), page_size] }
                }
            });
        } else {
            aggregate.push({
                "$project": {
                    "total": 1,
                    'notifications': "$results"
                }
            });
        }

        let notification = await Notification.aggregate(aggregate);

        if (notification && notification[0] && notification[0].total > 0) {
            return { "status": 1, "message": "Notification found", "notification": notification[0] };
        } else {
            return { "status": 2, "message": "No notification found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding notification", "error": err }
    }
}

notification_helper.insert_notification = async (notification_object) => {
    try {
        let notification = new Notification(notification_object);
        let notification_data = await notification.save();
        return { "status": 1, "message": "Notification has been inserted", "notification": notification_data };
    } catch (err) {
        return { "status": 0, "message": "Error occured while inserting notification", "error": err };
    }
};

notification_helper.update_notification_by_id = async (notification_id, notification_object) => {
    try {
        let notification = await Notification.findOneAndUpdate({ _id: notification_id }, notification_object);
        if (!notification) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated", "notification": notification };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while updating notification", "error": err }
    }
};

notification_helper.get_users_total_unread_notification = async(user_id) => {
    try{
        let count = await Notification.find({"user_id":user_id,"is_read":true}).count();
        return {"status":1,"message":"Total notification found","count":count};
    } catch(err){
        return {"status":0,"message":"Error in finding total unread notification","error":err}
    }
};

module.exports = notification_helper;