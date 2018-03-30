var express = require('express');
var router = express.Router();
var config = require('../config');
var promoter = require('../models/User');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var bcrypt = require('bcrypt');

var promoter_helper = require('./../helpers/promoter_helper');
var mail_helper = require('./../helpers/mail_helper');

var logger = config.logger;

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

/**
 * @api {post} /promoter_login Promoter Login
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
router.post('/promoter_login', async (req, res) => {

  logger.trace("API - Promoter login called");
  logger.debug("req.body = ", req.body);

  var schema = {
    'login_id': {
      notEmpty: true,
      errorMessage: "Email or username is required.",
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

    let promoter_resp = await promoter_helper.get_promoter_by_email_or_username(req.body.login_id);
    logger.trace("Promoter checked resp = ", promoter_resp);
    if (promoter_resp.status === 0) {
      logger.error("Error in finding promoter by email in promoter_login API. Err = ", promoter_resp.err);

      res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Something went wrong while finding promoter", "error": promoter_resp.error });
    } else if (promoter_resp.status === 1) {

      logger.trace("User found. Executing next instruction");
      // Checking password
      if(bcrypt.compareSync(req.body.password, promoter_resp.promoter.password)){

        // Valid password, now check account is active or not
        if(promoter_resp.promoter.status && promoter_resp.promoter.email_verified){
          // Account is active
          logger.trace("valid password. Generating token");

          var refreshToken = jwt.sign({ id: promoter_resp.promoter._id, role: 'promoter' }, config.REFRESH_TOKEN_SECRET_KEY, {});
          let update_resp = await promoter_helper.update_promoter_by_id(promoter_resp.promoter._id, { "refresh_token": refreshToken, "last_login_date": Date.now() });
          var promoterJson = { id: promoter_resp.promoter._id, email: promoter_resp.promoter.email, role: 'promoter' };
          var token = jwt.sign(promoterJson, config.ACCESS_TOKEN_SECRET_KEY, {
            expiresIn: config.ACCESS_TOKEN_EXPIRE_TIME
          });

          delete promoter_resp.promoter.password;
          delete promoter_resp.promoter.status;
          delete promoter_resp.promoter.refresh_token;
          delete promoter_resp.promoter.last_login_date;
          delete promoter_resp.promoter.created_at;

          logger.info("Token generated");
          res.status(config.OK_STATUS).json({ "status": 1, "message": "Logged in successful", "promoter": promoter_resp.promoter, "token": token, "refresh_token": refreshToken });
        } else {
          if(promoter_resp.promoter.status){
            logger.trace("Account is inactive");
            res.status(config.BAD_REQUEST).json({"status":0,"message":"Account is not active. Contact to admin for more information."});
          } else {
            logger.trace("Account is inactive");
            res.status(config.BAD_REQUEST).json({"status":0,"message":"Please verify your email to logged-in"});
          }
        }
      } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid email address or password" });
      }
    } else {
      logger.info("Account doesn't exist.");
      res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid email address or password" });
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

/**
 * @api {post} /promoter_signup Promoter Signup
 * @apiName Promoter Signup
 * @apiGroup Root
 * 
 * @apiDescription  Signup request for promoter role
 * 
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {String} name Full name of promoter
 * @apiParam {String} username Username
 * @apiParam {String} email Email address
 * @apiParam {String} company Name of the company
 * @apiParam {String} password Password
 * 
 * @apiSuccess (Success 200) {String} message Success message
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/promoter_signup', async (req, res) => {

  logger.trace("API - Promoter signup called");
  logger.debug("req.body = ", req.body);
  var schema = {
      'name': {
          notEmpty: true,
          errorMessage: "Full name is required"
      },
      'username': {
        notEmpty: true,
        errorMessage: "Username is required"
      },
      'email': {
        notEmpty: true,
        errorMessage: "Email address is required",
        isEmail: {errorMessage: "Please enter valid email address"}
      },
      'company': {
          notEmpty: true,
          errorMessage: "Company name is required"
      },
      'password': {
        notEmpty: true,
        errorMessage: "Password is required"
      }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();
  if (!errors) {
    let data = req.body;
    var promoter_obj = {
      "full_name" : req.body.name,
      "email": req.body.email,
      "username": req.body.username,
      "company":req.body.company,
      "password": req.body.password
    };

    // Check email availability
    var promoter = await promoter_helper.get_promoter_by_email_or_username(req.body.email)
    if(promoter.status === 2){

      // Check username availability
      promoter = await promoter_helper.get_promoter_by_email_or_username(req.body.username)
      if(promoter.status === 2){

        // Insert promoter
        var promoter_data = await promoter_helper.insert_promoter(promoter_obj);

        if(promoter_data.status == 0){
          logger.trace("Error occured while inserting promoter - Promoter Signup API");
          logger.debug("Error = ",promoter_data.error);
          res.status(config.INTERNAL_SERVER_ERROR).json(promoter_data);
        } else {
          logger.trace("Promoter has been inserted");
          // Send email confirmation mail to user
          logger.trace("sending mail");
          let mail_resp = await mail_helper.send("email_confirmation",{
            "to":promoter_data.promoter.email,
            "subject":"Clique Lab - Email confirmation"
          },{
            "confirm_url":config.website_url+"/email_confirm/"+promoter_resp.promoter._id
          });

          console.log("mail resp = ",mail_resp);
          if(mail_resp.status === 0){
              res.status(config.INTERNAL_SERVER_ERROR).json({"status":0,"message":"Error occured while sending confirmation email","error":mail_resp.error});
          } else {
              res.status(config.OK_STATUS).json({"status":1,"message":"Confirmation link has been sent on your email address"});
          }

          res.status(config.OK_STATUS).json({"status":1,"message":"Promoter registered successfully"});
        }
      } else {
        res.status(config.BAD_REQUEST).json({"status":0,"message":"Promoter's username already exist"});
      }
    } else {
      res.status(config.BAD_REQUEST).json({"status":0,"message":"Promoter's email already exist"});
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

module.exports = router;