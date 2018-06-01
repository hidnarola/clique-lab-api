var express = require("express");
var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var earning_helper = require("./../../helpers/earning_helper");

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
        let earnings = await earning_helper.get_earning_by_user(req.userInfo.id);
        res.status(200).json({"transaction":earnings});
    } else {
        logger.error("Validation Error = ", errors);
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

module.exports = router;