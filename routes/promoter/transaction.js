var express = require("express");
var moment = require("moment");

var router = express.Router();

var config = require('./../../config');


/**
 * 
 */
router.post('/', async (req, res) => {
    var schema = {
        'page_no': {
            notEmpty: true,
            errorMessage: "page number is required"
        },
        'page_size': {
            notEmpty: true,
            errorMessage: "page size is required"
        }
    };

    req.checkBody(schema);
    const errors = req.validationErrors();

    if (!errors) {
        
    } else {
        res.status(config.BAD_REQUEST).json({ "status":0, "message": errors });
    }
});

module.exports = router;