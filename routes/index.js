var express = require('express');
var router = express.Router();
var config = require('../config');
var promoter = require('../models/User');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var bcrypt = require('bcrypt');

var promoter_helper = require('./../helpers/promoter_helper');

var logger = config.logger;

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

/**
 * @api {post} /promotor_login Promoter Login
 * @apiName Promoter Login
 * @apiGroup Root
 * 
 * @apiDescription  Login request for promoter role
 * 
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {String} email Email
 * @apiParam {String} password Password
 * 
 * @apiSuccess (Success 200) {JSON} promoter Promoter object.
 * @apiSuccess (Success 200) {String} token Unique token which needs to be passed in subsequent requests.
 * @apiSuccess (Success 200) {String} refresh_token Unique token which needs to be passed to generate next access token.
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/promotor_login', async (req, res) => {

  logger.trace("API - Promoter login called");
  logger.debug("req.body = ", req.body);

  var schema = {
    'email': {
      notEmpty: true,
      errorMessage: "Email is required.",
      isEmail: { errorMessage: "Please enter valid email address" }
    },
    'password': {
      notEmpty: true,
      errorMessage: "Password is required."
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();
  if (!errors) {
    logger.trace("Valid request of login");

    // Checking for promoter availability
    logger.trace("Checking for promoter availability");

    let promoter_resp = await promoter_helper.get_promoter_by_email(req.body.email);
    logger.trace("Promoter checked resp = ", promoter_resp);
    if (promoter_resp.status === 0) {
      logger.error("Error in finding promoter by email in promoter_login API. Err = ", promoter_resp.err);

      res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Something went wrong while finding promoter", "error": promoter_resp.error });
    } else if (promoter_resp.status === 1) {
      logger.trace("User found. Executing next instruction");

      // Checking password
      if(bcrypt.compareSync(req.body.old_password, college_resp.college.password)){
        logger.trace("valid password. Generating token");
        var refreshToken = jwt.sign({ id: promoter_resp.promoter._id, role: 'promoter' }, config.REFRESH_TOKEN_SECRET_KEY, {});

        let update_resp = await promoter_helper.update_promoter_by_id(promoter_resp.promoter._id, { "refresh_token": refreshToken, "lastLoginDate": Date.now() });

        var promoterJson = { id: promoter_resp.promoter._id, email: promoter_resp.promoter.email, role: 'promoter' };
        var token = jwt.sign(promoterJson, config.ACCESS_TOKEN_SECRET_KEY, {
          expiresIn: config.ACCESS_TOKEN_EXPIRE_TIME
        });

        delete promoter_resp.promoter.password;
        delete promoter_resp.promoter.refresh_token;
        delete promoter_resp.promoter.last_login_date;
        delete promoter_resp.promoter.created_at;

        logger.info("Token generated");
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Logged in successful", "promoter": promoter_resp.promoter, "token": token, "refresh_token": refreshToken });
      } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid email address or password" });
      }
    } else {
      logger.info("Account doesn't exist.");
      res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid email address" });
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

module.exports = router;
