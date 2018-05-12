var express = require("express");
var moment = require("moment");

var router = express.Router();

var config = require('./../../config');
var referral_helper = require('./../../helpers/referral_helper');

/**
 * View number joined user by referral of particular promoter
 * /promoter/referral/referral_view
 * Developed by "ar"
 */
router.post('/referral_view', async (req, res) => {
    var schema = {
        'start_date': {
            notEmpty: true,
            errorMessage: "Start date is required"
        },
        'end_date': {
            notEmpty: true,
            errorMessage: "Start date is required"
        }
    };

    req.checkBody(schema);
    const errors = req.validationErrors();

    if (!errors) {

        var startdate = moment(req.body.start_date, "YYYY-MM-DD").toDate();
        var enddate = moment(req.body.end_date, "YYYY-MM-DD").toDate();

        console.log("start = ", startdate);
        console.log("end = ", enddate);

        let filter = {
            "created_at": {
                "$gte": moment(req.body.start_date, "YYYY-MM-DD").toDate(),
                "$lte": moment(req.body.end_date, "YYYY-MM-DD").toDate()
            }
        }

        let view_resp = await referral_helper.get_joined_referral_by_promoter(req.userInfo.id,filter);

        res.status(config.OK_STATUS).json(view_resp);

    } else {
        res.status(config.BAD_REQUEST).json({ message: errors });
    }
});

module.exports = router;