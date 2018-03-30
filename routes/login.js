var express = require('express');
var router = express.Router();
var config = require('../config');
var user = require('../models/User');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var bcrypt = require('bcrypt');

var login_helper = require('./../helpers/login_helper');

var logger = config.logger;

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

/**
 * @api {post} /login Login
 * @apiName  Login
 * @apiGroup Root
 * 
 * @apiDescription Login request
 * 
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {String} email Email
 * @apiParam {String} token as facebook token
 * 
 * @apiSuccess (Success 200) {JSON} user Admin user object.
 * @apiSuccess (Success 200) {String} token Unique token which needs to be passed in subsequent requests.
 * @apiSuccess (Success 200) {String} refresh_token Unique token which needs to be passed to generate next access token.
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/login', async (req, res) => {

  logger.trace("API - Promoter login called");
  logger.debug("req.body = ", req.body);

  var schema = {
    'email': {
      notEmpty: true,
      errorMessage: "Email is required.",
      isEmail: { errorMessage: "Please enter valid email address" }
    },
    'token': {
      notEmpty: true,
      errorMessage: "token is required."
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();
  if (!errors) {
    logger.trace("Valid request of login");

    // Checking for promoter availability
    logger.trace("Checking for promoter availability");

    let login_resp = await login_helper.get_login_by_email(req.body.email);
    logger.trace("Login checked resp = ", login_resp);
    if (login_resp.status === 0) {
    logger.trace("Login checked resp = ", login_resp);
      logger.error("Error in finding by email in login API. Err = ", login_resp.err);

      res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Something went wrong while finding promoter", "error": promoter_resp.error });
    } else if (login_resp.status === 1) {
      logger.trace("User found. Executing next instruction");

      // Checking password
      if(req.body.token=== login_resp.user.facebook.token){
        logger.trace("valid token. Generating token");
        var refreshToken = jwt.sign({ id: login_resp._id}, config.REFRESH_TOKEN_SECRET_KEY, {});

        let update_resp = await login_helper.update_by_id(login_resp._id, { "refresh_token": refreshToken, "last_login_date": Date.now() });

        var LoginJson = { id: login_resp._id, email: login_resp.email };
        var token = jwt.sign(LoginJson, config.ACCESS_TOKEN_SECRET_KEY, {
          expiresIn: config.ACCESS_TOKEN_EXPIRE_TIME
        });

        delete login_resp.password;
        delete login_resp.refresh_token;
        delete login_resp.last_login_date;
        delete login_resp.created_at;

        logger.info("Token generated");
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Logged in successful", "token": token, "refresh_token": refreshToken });
      } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid email address or token" });
      }
    } else {
      logger.info("Account doesn't exist.");
      res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid email address or token" });
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

module.exports = router;
