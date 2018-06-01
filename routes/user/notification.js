var express = require("express");
var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var notification_helper = require("./../../helpers/notification_helper");

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
        let notifications = await notification_helper.get_notification_for_user(req.userInfo.id,req.body.page_no,req.body.page_size);
        if(notifications.status === 1) {
            res.status(config.OK_STATUS).json(notifications);
        } else {
            res.status(config.BAD_REQUEST).json(notifications);
        }
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

module.exports = router;