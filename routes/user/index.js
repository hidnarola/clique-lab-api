var express = require("express");
var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var user_helper = require("./../../helpers/user_helper");

/**
 * @api {get} /user Profile - Get 
 * @apiName get_profile_by_id - Get
 * @apiGroup User
 *
 * @apiHeader {String}  x-access-token unique access-key
 *
 * @apiSuccess (Success 200) {Array} Profile as per id
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/", async (req, res) => {
    user_id = req.userInfo.id;
    logger.trace("Get all Profile API called");
    var resp_data = await user_helper.get_user_by_id(user_id);
    if (resp_data.status == 0) {
        logger.error("Error occured while fetching Profile = ", resp_data);
        res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
        logger.trace("Profile got successfully = ", resp_data);
        res.status(config.OK_STATUS).json(resp_data);
    }
});

module.exports = router;