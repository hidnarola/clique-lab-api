var express = require('express');
var router = express.Router();
var config = require('../config');
var promoter = require('../models/User');
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
 * @api {post} /admin_login Admin Login
 * @apiName Admin Login
 * @apiGroup Root
 * 
 * @apiDescription Login request for admin role
 * 
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {String} email Email
 * @apiParam {String} password Password
 * 
 * @apiSuccess (Success 200) {JSON} user Admin user object.
 * @apiSuccess (Success 200) {String} token Unique token which needs to be passed in subsequent requests.
 * @apiSuccess (Success 200) {String} refresh_token Unique token which needs to be passed to generate next access token.
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/admin_login', async (req, res) => {

    logger.trace("API - Admin login called");
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
  
      // Checking for user availability
      logger.trace("Checking for user availability");
  
      let user_resp = await admin_helper.get_admin_by_email(req.body.email);
      logger.trace("User checked resp = ", user_resp);
      if (user_resp.status === 0) {
        logger.error("Error in finding user by email in user_login API. Err = ", user_resp.err);
  
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Something went wrong while finding user", "error": user_resp.error });
      } else if (user_resp.status === 1) {
        logger.trace("User found. Executing next instruction");
  
        // Checking password
  
        common_helper.hashPassword.call({ password: req.body.password, hash: user_resp.admin.password }, async (password_resp) => {
          logger.trace("password resp = ", password_resp);
          if (password_resp.status === 0 || password_resp.res === false) {
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid email address or password" });
          } else {
            if (user_resp.admin.status) {
              // Generate token
              logger.trace("valid admin request. Generating token");
              var refreshToken = jwt.sign({ id: user_resp.admin._id }, config.REFRESH_TOKEN_SECRET_KEY, {});
  
              let update_resp = await admin_helper.update_admin_by_id(user_resp.admin._id, { "refreshToken": refreshToken, "lastLoginDate": Date.now() });
  
              var userJson = { id: user_resp.admin._id, email: user_resp.admin.email, role: 'admin' };
              var token = jwt.sign(userJson, config.ACCESS_TOKEN_SECRET_KEY, {
                expiresIn: config.ACCESS_TOKEN_EXPIRE_TIME
              });
  
              delete user_resp.admin.password;
              delete user_resp.admin.refreshToken;
              delete user_resp.admin.lastLoginDate;
              delete user_resp.admin.createdAt;
              await delete user_resp.admin.modifiedAt;
  
              logger.info("Token generated");
              res.status(config.OK_STATUS).json({ "status": 1, "message": "Logged in successful", "user": user_resp.admin, "token": token, "refresh_token": refreshToken });
            } else {
              logger.trace("Admin account is not active");
              res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Account is not active" })
            }
          }
        });
  
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
