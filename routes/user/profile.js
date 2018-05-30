var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");

var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var user_helper = require("./../../helpers/user_helper");

/*update */
router.put("/:id", async (req, res) => {
    user_id = req.userInfo.id;
    logger.trace("Get all Offered Campaign API called");
    var resp_data = await user_helper.bank_detail_update(user_id,req.params.id,req.body);
    if (resp_data.status == 0) {
      logger.error("Error occured while fetching offered Campaign = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
      logger.trace("Offered Campaign got successfully = ", resp_data);
      res.status(config.OK_STATUS).json(resp_data);
    }
  });

  /**
 * @api {get} /user/profile/bank_detail Bank detail - Get 
 * @apiName get_profile_by_id - Get
 * @apiGroup User
 *
 * @apiHeader {String}  x-access-token unique access-key
 *
 * @apiSuccess (Success 200) {Array} bank detail as per id
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

 router.get("/bank_detail/zz", async (req, res) => {
    user_id = req.userInfo.id;
    logger.trace("Get all Bank Detail API called");
    var resp_data = await user_helper.get_bank_detail(user_id);
    if (resp_data.status == 0) {
        logger.error("Error occured while fetching Bank Detail = ", resp_data);
        res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
        logger.trace("Bank Detail got successfully = ", resp_data);
        res.status(config.OK_STATUS).json(resp_data);
    }
});

router.delete("/bank_detail/:accout_id/zz", async (req, res) => {
    user_id = req.userInfo.id;
    logger.trace("Get all Bank Detail API called");
    var resp_data = await user_helper.get_bank_detail(user_id);
    if (resp_data.status == 0) {
        logger.error("Error occured while fetching Bank Detail = ", resp_data);
        res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
        logger.trace("Bank Detail got successfully = ", resp_data);
        res.status(config.OK_STATUS).json(resp_data);
    }
});

module.exports = router;