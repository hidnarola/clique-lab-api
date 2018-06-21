var express = require("express");
var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var notification_helper = require("./../../helpers/notification_helper");
var user_helper = require("./../../helpers/user_helper");

router.post('/', async (req, res) => {
    var schema = {
        'page_size': {
            notEmpty: true,
            errorMessage: "Page size is required"
        },
        'page_no': {
            notEmpty: true,
            errorMessage: "Page number is required"
        }
    };
    req.checkBody(schema);
    var errors = req.validationErrors();

    if (!errors) {
        let notifications = await notification_helper.get_notification_for_user(req.userInfo.id, req.body.page_no, req.body.page_size);
        if (notifications.status === 1) {
            res.status(config.OK_STATUS).json(notifications);
        } else {
            res.status(config.BAD_REQUEST).json(notifications);
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

router.get('/settings', async (req, res) => {
    let user_resp = await user_helper.get_user_by_id(req.userInfo.id);
    if (user_resp.status === 1) {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Notification settings found", "settings": user_resp.User.notification_settings });
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Can't find notification settings for user" });
    }
});

router.post('/settings', async (req, res) => {
    var schema = {
        'got_approved': {
            notEmpty: true,
            errorMessage: "'Got approved' flag is required"
        },
        'got_paid': {
            notEmpty: true,
            errorMessage: "'Got paid' flag is required"
        },
        'friend_just_got_paid': {
            notEmpty: true,
            errorMessage: "'Friend got paid' flag is required"
        },
        'got_new_offer': {
            notEmpty: true,
            errorMessage: "'Got new offer' flag is required"
        },
        'push_got_approved': {
            notEmpty: true,
            errorMessage: "'Push - got approved' flag is required"
        },
        'push_got_paid': {
            notEmpty: true,
            errorMessage: "'Push - got paid' flag is required"
        },
        'push_friend_just_got_paid': {
            notEmpty: true,
            errorMessage: "'Push - friend got paid' flag is required"
        },
        'push_got_new_offer': {
            notEmpty: true,
            errorMessage: "'Push - got new offer' flag is required"
        }
    };
    req.checkBody(schema);
    var errors = req.validationErrors();

    if (!errors) {
        obj = {
            "notification_settings": {
                "got_approved": req.body.got_approved,
                "got_paid": req.body.got_paid,
                "friend_just_got_paid": req.body.friend_just_got_paid,
                "got_new_offer": req.body.got_new_offer,
                "push_got_approved": req.body.push_got_approved,
                "push_got_paid": req.body.push_got_paid,
                "push_friend_just_got_paid": req.body.push_friend_just_got_paid,
                "push_got_new_offer": req.body.push_got_new_offer
            }
        }
        let user_resp = await user_helper.update_user_by_id(req.userInfo.id, obj);
        if (user_resp.status === 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Settings has been updated" });
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error occured while updating settings" });
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": errors });
    }
});

router.get('/read/:notification_id', async (req, res) => {
    try {
        let notification_resp = await notification_helper.update_notification_by_id(req.params.notification_id, { "is_read": true });
        if (notification_resp.status == 1) {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Notification has been marked as read" });
        } else {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error in updating notification status" });
        }
    } catch (err) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error in updating notification status" });
    }
});

router.get('/unread_count', async (req, res) => {
    try {
        let notification_resp = await notification_helper.get_users_total_unread_notification(req.userInfo.id);
        if (notification_resp.status == 1) {
            res.status(config.OK_STATUS).json(notification_resp);
        } else {
            res.status(config.BAD_REQUEST).json(notification_resp);
        }
    } catch (err) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error while finding unread count" });
    }
});

module.exports = router;