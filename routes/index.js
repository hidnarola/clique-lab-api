var express = require('express');
var router = express.Router();
var config = require('../config');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var fs = require("fs");

const saltRounds = 10;

var promoter_helper = require('./../helpers/promoter_helper');
var admin_helper = require('./../helpers/admin_helper');
var mail_helper = require('./../helpers/mail_helper');
var interest_helper = require("../helpers/interest_helper");
var job_industry = require("../helpers/job_industry_helper");
var music_taste = require("../helpers/music_taste_helper");
var user_helper = require('./../helpers/user_helper');
var country_helper = require("./../helpers/country_helper");
var referral_helper = require("./../helpers/referral_helper");

var logger = config.logger;
var stripe = require("stripe")(config.STRIPE_SECRET_KEY);

/* GET home page. */
router.get('/', function (req, res) {
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
 * @apiParam {String} social_id as Social identification
 * @apiParam {String} social_type as Social media platform
 * @apiParam {String} [device_token] Token of mobile device
 * @apiParam {String} [device_platform] OS from which user logged-in. It can be android or ios
 * 
 * @apiSuccess (Success 200) {JSON} user  user object.
 * @apiSuccess (Success 200) {String} token Unique token which needs to be passed in subsequent requests.
 * @apiSuccess (Success 200) {String} refresh_token Unique token which needs to be passed to generate next access token.
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/login', async (req, res) => {
  logger.trace("API - User login called");
  logger.debug("req.body = ", req.body);

  var schema = {
    'email': {
      notEmpty: true,
      errorMessage: "Email is required.",
      isEmail: { errorMessage: "Please enter valid email address" }
    },
    'social_id': {
      notEmpty: true,
      errorMessage: "Social identification is required."
    },
    'social_type': {
      notEmpty: true,
      errorMessage: "Social Type is required."
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();
  if (!errors) {
    logger.trace("Valid request of login");
    logger.trace("Checking for user availability");

    let login_resp = await user_helper.get_user_by_email(req.body.email);
    logger.trace("Login checked resp = ", login_resp);
    if (login_resp.status === 0) {
      logger.trace("Login checked resp = ", login_resp);
      logger.error("Error in finding by email in login API. Err = ", login_resp.err);

      res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Something went wrong while finding promoter", "error": promoter_resp.error });
    } else if (login_resp.status === 1) {

      logger.trace("User found. Executing next instruction");
      if (login_resp.user.status === false) {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Account has been suspended" });
      } else if (login_resp.user.removed === true) {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Account has been removed" });
      } else if (req.body.social_id == login_resp.user[req.body.social_type]['id']) {

        logger.trace("valid token. Generating token");

        var refreshToken = jwt.sign({ id: login_resp.user._id }, config.REFRESH_TOKEN_SECRET_KEY, {});
        let update_resp = await user_helper.update_user_by_id(login_resp.user._id, { "refresh_token": refreshToken, "last_login_date": Date.now() });
        var LoginJson = { id: login_resp.user._id, email: login_resp.email, role: "user" };

        var token = jwt.sign(LoginJson, config.ACCESS_TOKEN_SECRET_KEY, {
          expiresIn: config.ACCESS_TOKEN_EXPIRE_TIME
        });

        delete login_resp.user.status;
        delete login_resp.user.password;
        delete login_resp.user.refresh_token;
        delete login_resp.user.last_login_date;
        delete login_resp.user.created_at;

        // Add device token to DB
        if (req.body.device_token && req.body.device_platform) {
          await user_helper.add_device_token_for_user(login_resp.user._id, req.body.device_token, req.body.device_platform);
        }

        logger.info("Token generated");
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Logged in successful", "user": login_resp.user, "token": token, "refresh_token": refreshToken });
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



// Tested - OK
/**
 * @api {post} /promoter_login Promoter Login
 * @apiName Promoter Login
 * @apiGroup Root
 * 
 * @apiDescription  Login request for promoter role
 * 
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {String} login_id Email or username
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
      errorMessage: "Email or username is required."
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
      if (bcrypt.compareSync(req.body.password, promoter_resp.promoter.password)) {

        // Valid password, now check account is active or not
        if (!promoter_resp.promoter.removed) {
          if (promoter_resp.promoter.status && promoter_resp.promoter.email_verified) {
            // Account is active
            logger.trace("valid password. Generating token");

            var refreshToken = jwt.sign({ id: promoter_resp.promoter._id, role: 'promoter' }, config.REFRESH_TOKEN_SECRET_KEY, {});
            let update_resp = await promoter_helper.update_promoter_by_id(promoter_resp.promoter._id, { "refresh_token": refreshToken, "last_login_date": Date.now() });
            var promoterJson = { id: promoter_resp.promoter._id, email: promoter_resp.promoter.email, role: 'promoter' };
            var token = jwt.sign(promoterJson, config.ACCESS_TOKEN_SECRET_KEY, {
              expiresIn: config.ACCESS_TOKEN_EXPIRE_TIME
            });

            if (!promoter_resp.promoter.industry_fill) {
              promoter_resp.promoter.first_login = true;
            } else {
              promoter_resp.promoter.first_login = false;
            }

            delete promoter_resp.promoter.password;
            delete promoter_resp.promoter.status;
            delete promoter_resp.promoter.refresh_token;
            delete promoter_resp.promoter.last_login_date;
            delete promoter_resp.promoter.industry_fill;
            delete promoter_resp.promoter.created_at;

            logger.info("Token generated");
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Logged in successful", "promoter": promoter_resp.promoter, "token": token, "refresh_token": refreshToken });
          } else {
            if (!promoter_resp.promoter.status) {
              logger.trace("Account is inactive");
              res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Account is not approved or suspended by admin." });
            } else {
              logger.trace("Account is inactive");
              res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Please verify your email to logged-in" });
            }
          }
        } else {
          res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Acccount has been removed by admin. Contact to admin for more information" });
        }

      } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid login id or password" });
      }
    } else {
      logger.info("Account doesn't exist.");
      res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid login id or password" });
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

// Tested - OK
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
 * @apiParam {String} country Country
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
      isEmail: { errorMessage: "Please enter valid email address" }
    },
    'company': {
      notEmpty: true,
      errorMessage: "Company name is required"
    },
    'password': {
      notEmpty: true,
      errorMessage: "Password is required"
    },
    'country': {
      notEmpty: true,
      errorMessage: "Country is required"
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();
  if (!errors) {
    let data = req.body;
    var promoter_obj = {
      "full_name": req.body.name,
      "email": req.body.email,
      "username": req.body.username,
      "company": req.body.company,
      "password": req.body.password,
      "country": req.body.country
    };

    // Check email availability
    var promoter = await promoter_helper.get_promoter_by_email_or_username(req.body.email)
    if (promoter.status === 2) {

      // Check username availability
      promoter = await promoter_helper.get_promoter_by_email_or_username(req.body.username)
      if (promoter.status === 2) {

        // Insert promoter
        var promoter_data = await promoter_helper.insert_promoter(promoter_obj);

        if (promoter_data.status == 0) {
          logger.trace("Error occured while inserting promoter - Promoter Signup API");
          logger.debug("Error = ", promoter_data.error);
          res.status(config.INTERNAL_SERVER_ERROR).json(promoter_data);
        } else {
          logger.trace("Promoter has been inserted");
          // Send email confirmation mail to user
          logger.trace("sending mail");
          let mail_resp = await mail_helper.send("email_confirmation", {
            "to": promoter_data.promoter.email,
            "subject": "Clique Labs – Last step is to Confirm your Email."
          }, {
              "name": promoter_data.promoter.full_name,
              "confirm_url": config.website_url + "/email_confirm/" + promoter_data.promoter._id
            });

          console.log("mail resp = ", mail_resp);
          if (mail_resp.status === 0) {
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while sending confirmation email", "error": mail_resp.error });
          } else {
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Promoter registered successfully" });
          }
        }
      } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Promoter's username already exist" });
      }
    } else {
      res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Promoter's email already exist" });
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

router.post('/resend_email', async (req, res) => {
  var schema = {
    'email': {
      notEmpty: true,
      errorMessage: "Email is required.",
      isEmail: { errorMessage: "Please enter valid email address" }
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();
  if (!errors) {
    var promoter_resp = await promoter_helper.get_promoter_by_email_or_username(req.body.email);
    if (promoter_resp.status === 0) {
      res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error while finding promoter" });
    } else if (promoter_resp.status === 2) {
      res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No user available with given email" });
    } else {

      if (!promoter_resp.promoter.removed) {
        let mail_resp = await mail_helper.send("email_confirmation", {
          "to": promoter_resp.promoter.email,
          "subject": "Clique Labs – Last step is to Confirm your Email."
        }, {
            "name": promoter_resp.promoter.full_name,
            "confirm_url": config.website_url + "/email_confirm/" + promoter_resp.promoter._id
          });

        if (mail_resp.status === 0) {
          res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while sending confirmation email", "error": mail_resp.error });
        } else {
          res.status(config.OK_STATUS).json({ "status": 1, "message": "Mail has been to your email address" });
        }
      } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Account has been removed by admin. Please contact to admin for more details." });
      }
    }
  } else {
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

// Tested - OK
/**
 * @api {get} /promoter_email_verify/:token Promoter email verification
 * @apiName Promoter email verification
 * @apiGroup Root
 * 
 * @apiDescription  Email verification request for promoter
 * 
 * @apiSuccess (Success 200) {String} message Success message
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/promoter_email_verify/:promoter_id', async (req, res) => {
  logger.trace("API - Promoter email verify called");
  logger.debug("req.body = ", req.body);

  var promoter_resp = await promoter_helper.get_promoter_by_id(req.params.promoter_id);
  if (promoter_resp.status === 0) {
    logger.error("Error occured while finding promoter by id - ", req.params.promoter_id, promoter_resp.error);
    res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error has occured while finding promoter" });
  } else if (promoter_resp.status === 2) {
    logger.trace("Promoter not found in promoter email verify API");
    res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid token entered" });
  } else {
    // Promoter available
    if (promoter_resp.promoter.email_verified) {
      // Email already verified
      logger.trace("promoter already verified");
      res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Email already verified" });
    } else {
      // Verify email
      logger.trace("Valid request for email verification - ", promoter_resp.promoter._id);

      var update_resp = await promoter_helper.update_promoter_by_id(promoter_resp.promoter._id, { "email_verified": true, "status": true });
      if (update_resp.status === 0) {
        logger.trace("Error occured while updating promoter : ", update_resp.error);
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while verifying user's email" });
      } else if (update_resp.status === 2) {
        logger.trace("Promoter has not updated");
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error occured while verifying user's email" });
      } else {
        // Email verified!
        try {
          // Create stripe account of customer
          let customer = await stripe.customers.create(
            {
              email: promoter_resp.promoter.email,
              description: promoter_resp.promoter.email
            });

          var update_resp = await promoter_helper.update_promoter_by_id(promoter_resp.promoter._id, { "stripe_customer_id": customer.id });
          res.status(config.OK_STATUS).json({ "status": 1, "message": "Email has been verified" });

        } catch (err) {
          console.log("Error => ", err);
          res.status(config.BAD_REQUEST).json({ "status": 1, "message": "Email has been verified" });
        }
      }
    }
  }
});

// Tested - OK
/**
 * @api {post} /promoter_forgot_password Promoter forgot password
 * @apiName Promoter forgot password
 * @apiGroup Root
 * 
 * @apiDescription   Forgot password request for promoter role
 * 
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {String} email Email
 * 
 * @apiSuccess (Success 200) {String} message Appropriate success message
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/promoter_forgot_password', async (req, res) => {

  logger.trace("API - Promoter forgot password called");
  logger.debug("req.body = ", req.body);
  var schema = {
    'email': {
      notEmpty: true,
      errorMessage: "Email is required.",
      isEmail: { errorMessage: "Please enter valid email address" }
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();
  if (!errors) {



    var promoter_resp = await promoter_helper.get_promoter_by_email_or_username(req.body.email);
    if (promoter_resp.status === 0) {
      res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error while finding promoter" });
    } else if (promoter_resp.status === 2) {
      res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No user available with given email" });
    } else {

      if (promoter_resp.promoter.status && !promoter_resp.promoter.removed) {
        // Send mail on user's email address
        var reset_token = Buffer.from(jwt.sign({ "promoter_id": promoter_resp.promoter._id }, config.ACCESS_TOKEN_SECRET_KEY, {
          expiresIn: 60 * 60 * 2 // expires in 2 hour
        })).toString('base64');

        let mail_resp = await mail_helper.send("reset_password", {
          "to": promoter_resp.promoter.email,
          "subject": "Clique Labs - Reset password request"
        }, {
            "name": promoter_resp.promoter.full_name,
            "reset_link": config.website_url + "/forgot_password/" + reset_token
          });

        if (mail_resp.status === 0) {
          res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while sending mail to promoter", "error": mail_resp.error });
        } else {
          res.status(config.OK_STATUS).json({ "status": 1, "message": "Reset link has been sent on your email address" });
        }
      } else {
        if (promoter_resp.promoter.removed) {
          res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Account has been removed by admin. Please contact to admin for more details." });
        } else {
          res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Account is not approved or suspended by admin." });
        }
      }


    }
  } else {
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

// Tested - OK
/**
 * @api {post} /promoter_reset_password Promoter reset password
 * @apiName Promoter reset password
 * @apiGroup Root
 * 
 * @apiDescription   Reset password request for promoter role
 * 
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {String} token Reset password token
 * @apiParam {String} password New password
 * 
 * @apiSuccess (Success 200) {String} message Appropriate success message
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/promoter_reset_password', async (req, res) => {
  logger.trace("API - Promoter reset password called");
  logger.debug("req.body = ", req.body);
  var schema = {
    'token': {
      notEmpty: true,
      errorMessage: "Reset password token is required."
    },
    'password': {
      notEmpty: true,
      errorMessage: "Password is required."
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();
  if (!errors) {

    logger.trace("Verifying JWT");
    jwt.verify(Buffer.from(req.body.token, 'base64').toString(), config.ACCESS_TOKEN_SECRET_KEY, async (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          logger.trace("Link has expired");
          res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Link has been expired" });
        } else {
          logger.trace("Invalid link");
          res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid token sent" });
        }
      } else {
        logger.trace("Valid token. Reseting password for promoter");
        if (decoded.promoter_id) {
          var update_resp = await promoter_helper.update_promoter_by_id(decoded.promoter_id, { "password": bcrypt.hashSync(req.body.password, saltRounds) });
          if (update_resp.status === 0) {
            logger.trace("Error occured while updating promoter : ", update_resp.error);
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while verifying user's email" });
          } else if (update_resp.status === 2) {
            logger.trace("Promoter has not updated");
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error occured while reseting password of promoter" });
          } else {
            // Password reset!
            logger.trace("Password has been changed for promoter - ", decoded.promoter_id);
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Password has been changed" });
          }
        } else {
          res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid token sent" });
        }
      }
    });
  } else {
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

// Tested - OK
// Can be used by both, user and promoter
/**
 * @api {get} /job_industry Get all job industry
 * @apiName Get all job industry
 * @apiGroup Root
 *
 * @apiSuccess (Success 200) {Array} job_industry Array of Job_industry document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/job_industry", async (req, res) => {
  logger.trace("Get all Job industry API called");
  var resp_data = await job_industry.get_all_job_industry();
  if (resp_data.status == 0) {
    logger.error("Error occured while fetching Job Industry = ", resp_data);
    res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
  } else {
    logger.trace("Job Industry got successfully = ", resp_data);
    res.status(config.OK_STATUS).json(resp_data);
  }
});

// Need to delete
/**
 * @api {get} /interest Interest - Get all
 * @apiName get_interest - Get all
 * @apiGroup Root
 *
 * @apiSuccess (Success 200) {Array} interest All possible user interest document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/interest", async (req, res) => {
  logger.trace("Get all Interest API called");
  var resp_data = await interest_helper.get_all_interest();
  if (resp_data.status == 0) {
    logger.error("Error occured while fetching interest = ", resp_data);
    res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
  } else {
    logger.trace("Interest got successfully = ", resp_data);
    res.status(config.OK_STATUS).json(resp_data);
  }
});

// Need to remove
/**
 * @api {get} /music_taste/ Music Taste - Get all
 * @apiName Music taste - Get all
 * @apiGroup Root

 * @apiHeader {String}  x-access-token unique access-key
 *
 * @apiSuccess (Success 200) {Array}  Music taste of User document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/music_taste", async (req, res) => {
  logger.trace("Get all Music Taste API called");
  var resp_data = await music_taste.get_all_music_taste();
  if (resp_data.status == 0) {
    logger.error("Error occured while fetching Music Taste = ", resp_data);
    res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
  } else {
    logger.trace("Music Taste got successfully = ", resp_data);
    res.status(config.OK_STATUS).json(resp_data);
  }
});

// Need to add other social details and refresh_token
/** 
 * @api {post} /social_registration Social Registration
 * @apiName Social Registration
 * @apiGroup Root
 * 
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {String} name Name of User
 * @apiParam {String} email Email of User
 * @apiParam {String} [gender] Gender of User
 * @apiParam {String} social_type Social Type of User
 * @apiParam {String} social_id Social Id of User
 * @apiParam {String} [referral_id] Referral id of invited promoter
 * @apiParam {String} [username] Username of social platform
 * @apiParam {String} access_token Access token of social platform
 * @apiParam {String} [access_token_secret] Access token secret of social platform (Twitter)
 * @apiParam {String} [device_token] Token of mobile device
 * @apiParam {String} [device_platform] OS from which user logged-in. It can be android or ios
 * 
 * @apiSuccess (Success 200) {JSON} User details
 * @apiError (Error 4xx) {String} message Validation or error message
 **/
router.post('/social_registration', async (req, res) => {
  var schema = {
    "name": {
      notEmpty: true,
      errorMessage: "Name is required"
    },
    // "email": {
    //   notEmpty: true,
    //   errorMessage: "Email is required"
    // },
    // "gender": {
      // notEmpty: true,
      // errorMessage: "Gender is required"
    // },
    "social_type": {
      notEmpty: true,
      errorMessage: "Social Type is required"
    },
    "social_id": {
      notEmpty: true,
      errorMessage: "Social identification is required"
    },
    "access_token": {
      notEmpty: true,
      errorMessage: "Access Token is required"
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();

  if (!errors) {

    let user_resp = await user_helper.get_user_by_email(req.body.email);
    if (user_resp.status === 1) {
      if (user_resp.user.status === false) {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Account has been suspended" });
      } else if (user_resp.user.removed === true) {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Account has been removed" });
      } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "This account is already exist" });
      }
    } else {
      var reg_obj = {
        "name": req.body.name,
        // "gender": req.body.gender,
        "facebook": { "no_of_friends": 0 },
        "instagram": { "no_of_friends": 0 },
        "twitter": { "no_of_friends": 0 },
        "pinterest": { "no_of_friends": 0 },
        "linkedin": { "no_of_friends": 0 },
        "notification_settings": {}
      };

      if (req.body.email) {
        reg_obj.email = req.body.email;
      }
	  if (req.body.gender) {
        reg_obj.gender = req.body.gender;
      }
      if (req.body.social_type === "facebook") {
        reg_obj.facebook = {
          "id": req.body.social_id,
          "access_token": req.body.access_token
        };
        if (req.body.username) {
          reg_obj.facebook['username'] = req.body.username;
        }
      } else if (req.body.social_type === "instagram") {
        reg_obj.instagram = {
          "id": req.body.social_id,
          "access_token": req.body.access_token
        };
        if (req.body.username) {
          reg_obj.instagram['username'] = req.body.username;
        }
      } else if (req.body.social_type == "pinterest") {
        reg_obj.pinterest = {
          "id": req.body.social_id,
          "access_token": req.body.access_token
        };
        if (req.body.username) {
          reg_obj.pinterest['username'] = req.body.username;
        }
      } else if (req.body.social_type == "twitter") {
        reg_obj.twitter = {
          "id": req.body.social_id,
          "access_token": req.body.access_token,
          "access_token_secret": req.body.access_token_secret
        };
        if (req.body.username) {
          reg_obj.twitter['username'] = req.body.username;
        }
      } else if (req.body.social_type == "linkedin") {
        reg_obj.linkedin = {
          "id": req.body.social_id,
          "access_token": req.body.access_token
        };
        if (req.body.username) {
          reg_obj.linkedin['username'] = req.body.username;
        }
      }

      // Check for referral
      if (req.body.referral_id) {
        reg_obj.referral_id = req.body.referral_id;
      }

      let reg_data = await user_helper.insert_user(reg_obj);
      if (reg_data.status === 0) {
        res.status(config.BAD_REQUEST).json(reg_data);
      } else {
        // Add device token to DB
        if (req.body.device_token && req.body.device_platform) {
          console.log("adding device token");
          await user_helper.add_device_token_for_user(reg_data.user._id, req.body.device_token, req.body.device_platform);
        }

        if (req.body.referral_id) {
          // Find referral promoter
          // Check for referral
          let referral_promoter = await promoter_helper.get_promoter_by_id(req.body.referral_id);
          if (referral_promoter.status == 1) {
            // Update some referral reward to promoter's account
            let updated_promoter = await promoter_helper.update_promoter_by_id(req.body.referral_id, { "wallet_balance": referral_promoter.promoter.wallet_balance + config.REFERRAL_REWARD });
            let referral_obj = {
              "promoter_id": req.body.referral_id,
              "user_id": reg_data.user._id,
              "reward_amount": config.REFERRAL_REWARD
            };
            let referral_resp = await referral_helper.insert_referral(referral_obj);
            res.status(config.OK_STATUS).json(reg_data);
          } else {
            res.status(config.OK_STATUS).json(reg_data);
          }
        } else {
          res.status(config.OK_STATUS).json(reg_data);
        }
      }
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

/**
 * Get country list
 * /country
 * Developed by "mm",
 * Changed by "ar"
 */
router.get("/country", async (req, res) => {
  logger.trace("Get country  API called");
  var resp_data = await country_helper.get_all_country();

  if (resp_data.status === 0) {
    logger.error("Error occured while fetching Countries= ", resp_data);
    res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
  } else {
    logger.trace("got countries successfully");
    res.status(config.OK_STATUS).json(resp_data);
  }
});

router.post("/chk_image_availablity", async (req, res) => {
  if (fs.existsSync('.' + req.body.image_name)) {
    res.status(config.OK_STATUS).json({ "status": 1, "message": "Image is available" });
  } else {
    res.status(config.NOT_FOUND).json({ "status": 404, "message": "Image is not available" });
  }
});

/**
 * @api {post} /admin_login Admin Login
 * @apiName Admin Login
 * @apiGroup Root
 * 
 * @apiDescription  Login request for admin role
 * 
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {String} login_id Email or username
 * @apiParam {String} password Password
 * 
 * @apiSuccess (Success 200) {JSON} admin Admin object.
 * @apiSuccess (Success 200) {String} token Unique token which needs to be passed in subsequent requests.
 * @apiSuccess (Success 200) {String} refresh_token Unique token which needs to be passed to generate next access token.
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/admin_login', async (req, res) => {

  logger.trace("API - Admin login called");
  logger.debug("req.body = ", req.body);

  var schema = {
    'login_id': {
      notEmpty: true,
      errorMessage: "Email or username is required."
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

    // Checking for admin availability
    logger.trace("Checking for admin availability");

    let admin_resp = await admin_helper.get_admin_by_email_or_username(req.body.login_id);
    logger.trace("Admin checked resp = ", admin_resp);
    if (admin_resp.status === 0) {
      logger.error("Error in finding admin by email_or_username in admin_login API. Err = ", admin_resp.err);

      res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Something went wrong while finding admin", "error": admin_resp.error });
    } else if (admin_resp.status === 1) {

      logger.trace("Admin found. Executing next instruction");
      // Checking password
      if (req.body.password == admin_resp.admin.password) {

        // Valid password, now check account is active or not
        if (admin_resp.admin.status) {
          // Account is active
          logger.trace("valid password. Generating token");

          var refreshToken = jwt.sign({ id: admin_resp.admin._id, role: 'admin' }, config.REFRESH_TOKEN_SECRET_KEY, {});
          let update_resp = await admin_helper.update_admin_by_id(admin_resp.admin._id, { "refresh_token": refreshToken, "last_login_date": Date.now() });
          var adminJson = { id: admin_resp.admin._id, email: admin_resp.admin.email, role: 'admin' };
          var token = jwt.sign(adminJson, config.ACCESS_TOKEN_SECRET_KEY, {
            expiresIn: config.ACCESS_TOKEN_EXPIRE_TIME
          });

          if (!admin_resp.admin.industry_fill) {
            admin_resp.admin.first_login = true;
          } else {
            admin_resp.admin.first_login = false;
          }

          delete admin_resp.admin.password;
          delete admin_resp.admin.status;
          delete admin_resp.admin.refresh_token;
          delete admin_resp.admin.last_login_date;
          delete admin_resp.admin.created_at;

          logger.info("Token generated");
          res.status(config.OK_STATUS).json({ "status": 1, "message": "Logged in successful", "admin": admin_resp.admin, "token": token, "refresh_token": refreshToken });
        } else {
          logger.trace("Account is inactive");
          res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Account is not active." });
        }
      } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid login id or password" });
      }
    } else {
      logger.info("Account doesn't exist.");
      res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid login id or password" });
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

/**
 * @api {post} /admin_forgot_password Admin forgot password
 * @apiName Admin forgot password
 * @apiGroup Root
 * 
 * @apiDescription   Forgot password request for admin role
 * 
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {String} email Email
 * 
 * @apiSuccess (Success 200) {String} message Appropriate success message
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/admin_forgot_password', async (req, res) => {

  logger.trace("API - Admin forgot password called");
  logger.debug("req.body = ", req.body);
  var schema = {
    'email': {
      notEmpty: true,
      errorMessage: "Email is required.",
      isEmail: { errorMessage: "Please enter valid email address" }
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();
  if (!errors) {
    var admin_resp = await admin_helper.get_admin_by_email_or_username(req.body.email);
    if (admin_resp.status === 0) {
      res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error while finding admin" });
    } else if (admin_resp.status === 2) {
      res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No admin available with given email" });
    } else {
      // Send mail on user's email address
      var reset_token = Buffer.from(jwt.sign({ "admin_id": admin_resp.admin._id }, config.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: 60 * 60 * 2 // expires in 2 hour
      })).toString('base64');

      let mail_resp = await mail_helper.send("reset_password", {
        "to": admin_resp.admin.email,
        "subject": "Clique Labs - Reset password request"
      }, {
          "name": admin_resp.admin.full_name,
          "reset_link": config.website_url + "/admin/forgot_password/" + reset_token
        });

      logger.debug("mail resp = ", mail_resp);
      if (mail_resp.status === 0) {
        res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while sending mail to admin", "error": mail_resp.error });
      } else {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Reset link has been sent on your email address" });
      }
    }
  } else {
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

/**
 * @api {post} /admin_reset_password Admin reset password
 * @apiName Admin reset password
 * @apiGroup Root
 * 
 * @apiDescription   Reset password request for admin role
 * 
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiParam {String} token Reset password token
 * @apiParam {String} password New password
 * 
 * @apiSuccess (Success 200) {String} message Appropriate success message
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/admin_reset_password', async (req, res) => {
  logger.trace("API - Admin reset password called");
  logger.debug("req.body = ", req.body);
  var schema = {
    'token': {
      notEmpty: true,
      errorMessage: "Reset password token is required."
    },
    'password': {
      notEmpty: true,
      errorMessage: "Password is required."
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();
  if (!errors) {

    logger.trace("Verifying JWT");
    jwt.verify(Buffer.from(req.body.token, 'base64').toString(), config.ACCESS_TOKEN_SECRET_KEY, async (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          logger.trace("Link has expired");
          res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Link has been expired" });
        } else {
          logger.trace("Invalid link");
          res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid token sent" });
        }
      } else {
        logger.trace("Valid token. Reseting password for promoter");
        if (decoded.admin_id) {
          var update_resp = await admin_helper.update_admin_by_id(decoded.admin_id, { "password": req.body.password });
          if (update_resp.status === 0) {
            logger.trace("Error occured while updating admin : ", update_resp.error);
            res.status(config.INTERNAL_SERVER_ERROR).json({ "status": 0, "message": "Error occured while verifying user's email" });
          } else if (update_resp.status === 2) {
            logger.trace("Admin has not updated");
            res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Error occured while reseting password of admin" });
          } else {
            // Password reset!
            logger.trace("Password has been changed for admin - ", decoded.admin_id);
            res.status(config.OK_STATUS).json({ "status": 1, "message": "Password has been changed" });
          }
        } else {
          res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid token sent" });
        }
      }
    });
  } else {
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

module.exports = router;