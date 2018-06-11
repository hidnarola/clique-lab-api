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
    if(user_resp.status === 1){
        res.status(config.OK_STATUS).json({"status":1,"message":"Notification settings found", "settings":user_resp.User.notification_settings});
    } else {
        res.status(config.BAD_REQUEST).json({"status":0,"message":"Can't find notification settings for user"});
    }
})

module.exports = router;