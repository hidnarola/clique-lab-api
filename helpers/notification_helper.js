var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var Notification = require("./../models/Notification");
var notification_helper = {};
/*
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
module.exports = notification_helper;