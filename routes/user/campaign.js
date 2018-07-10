var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");

var router = express.Router();

var config = require("./../../config");
var logger = config.logger;
var PinIt = require('pin-it-node');

var campaign_helper = require("./../../helpers/campaign_helper");
var user_helper = require("./../../helpers/user_helper");
var promoter_helper = require("./../../helpers/promoter_helper");
var push_notification_helper = require('./../../helpers/push_notification_helper');
var notification_helper = require('./../../helpers/notification_helper');
var campaign_post_helper = require("./../../helpers/campaign_post_helper");
var earning_helper = require("./../../helpers/earning_helper");
var transaction_helper = require("./../../helpers/transaction_helper");

var PDK = require('node-pinterest');
var pinterest = PDK.init('AYSihE_YGAfDVXbYU3P7e85xncTzFSaDpm_8EORE2WRMweA4YAAAAAA');
var PinIt = require('pin-it-node');
var Twitter = require('twitter');
var parallel = require('async/parallel');
var randomstring = require("randomstring");
var request = require("request");
var sharp = require('sharp');
var stripe = require("stripe")(config.STRIPE_SECRET_KEY);

// var Linkedin = require('node-linked-in');
// var cfg = {};
// var linkedin = new Linkedin(cfg);
//pinterest.api('me').then(console.log);

/**
 * @api {post} /user/campaign/approved campaigns - Get by ID
 * @apiName campaigns - Get campaigns by ID
 * @apiGroup User
 *
 * @apiHeader {String}  x-access-token  unique access-key
 * 
 * @apiParam {String} user_id ID of campaigns
 * 
 * @apiSuccess (Success 200) {Array} Approved Campaign Array of campaigns 
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post("/approved", async (req, res) => {
  var schema = {
    "page_no": {
      notEmpty: true,
      errorMessage: "page_no is required"
    },
    "page_size": {
      notEmpty: true,
      errorMessage: "page_size is required"
    },
  };
  req.checkBody(schema);
  var errors = req.validationErrors();

  if (!errors) {
    let filter = {};
    let sort = {};
    var redact = {};

    if (req.body.social_media_platform) {
      filter["campaign.social_media_platform"] = { "$in": req.body.social_media_platform };
    }

    if (req.body.search) {
      var r = new RegExp(req.body.search);
      var regex = { "$regex": r, "$options": "i" };
      redact = {
        "$or": [
          { "$setIsSubset": [[req.body.search], "$campaign.at_tag"] },
          { "$setIsSubset": [[req.body.search], "$campaign.hash_tag"] },
          { "$eq": [{ "$substr": ["$campaign.name", 0, -1] }, req.body.search] }
        ]
      }
    }

    if (typeof req.body.price != "undefined") {
      sort["campaign.price"] = req.body.price;
    } else {
      sort["campaign._id"] = 1;
    }

    var resp_data = await campaign_helper.get_users_approved_campaign(req.userInfo.id, filter, redact, sort, req.body.page_no, req.body.page_size);

    if (resp_data.status == 0) {
      logger.error("Error occured while fetching campaign = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
      logger.trace("Public Campaign got successfully = ", resp_data);
      res.status(config.OK_STATUS).json(resp_data);
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

router.post("/approved_post", async (req, res) => {
  var schema = {
    "page_no": {
      notEmpty: true,
      errorMessage: "page_no is required"
    },
    "page_size": {
      notEmpty: true,
      errorMessage: "page_size is required"
    },
  };
  req.checkBody(schema);
  var errors = req.validationErrors();

  if (!errors) {
    let filter = {};
    let sort = {};
    var redact = {};

    if (req.body.social_media_platform) {
      filter["social_media_platform"] = { "$in": req.body.social_media_platform };
    }

    if (req.body.search) {
      var r = new RegExp(req.body.search);
      var regex = { "$regex": r, "$options": "i" };
      redact = {
        "$or": [
          { "$setIsSubset": [[req.body.search], "$campaign.at_tag"] },
          { "$setIsSubset": [[req.body.search], "$campaign.hash_tag"] },
          { "$eq": [{ "$substr": ["$campaign.name", 0, -1] }, req.body.search] }
        ]
      }
    }

    if (typeof req.body.price != "undefined") {
      sort["price"] = req.body.price;
    } else {
      sort["purchased_at"] = -1;
    }

    var resp_data = await campaign_helper.get_users_approved_post(req.userInfo.id, filter, redact, sort, req.body.page_no, req.body.page_size);

    if (resp_data.status == 0) {
      logger.error("Error occured while fetching campaign = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
      logger.trace("Public Campaign got successfully = ", resp_data);
      res.status(config.OK_STATUS).json(resp_data);
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

/**
 * @api {post} /user/campaign/public_campaign Campaign  - Get all
 * @apiName public campaign - Get all
  * @apiGroup User
 * @apiHeader {String}  x-access-token unique access-key
 *
 * @apiSuccess (Success 200) {Array} Campaign Array of Campaign document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post("/public_campaign", async (req, res) => {
  logger.trace("Get all Public Campaign API called");
  var filter = { "privacy": "public" };
  var redact = {};
  var sort = {};

  var schema = {
    "page_no": {
      notEmpty: true,
      errorMessage: "page_no is required"
    },
    "page_size": {
      notEmpty: true,
      errorMessage: "page_size is required"
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();

  if (!errors) {
    if (req.body.social_media_platform) {
      filter["social_media_platform"] = { "$in": req.body.social_media_platform };
    }

    if (req.body.search) {
      var r = new RegExp(req.body.search);
      var regex = { "$regex": r, "$options": "i" };
      redact = {
        "$or": [
          { "$setIsSubset": [[req.body.search], "$at_tag"] },
          { "$setIsSubset": [[req.body.search], "$hash_tag"] },
          { "$eq": [{ "$substr": ["$name", 0, -1] }, req.body.search] }
        ]
      }
    }

    if (typeof req.body.price != "undefined") {
      sort["price"] = req.body.price;
    } else {
      sort["_id"] = 1;
    }
    var resp_data = await campaign_helper.get_public_campaign_for_user(req.userInfo.id, filter, redact, sort, req.body.page_no, req.body.page_size);
    if (resp_data.status == 0) {
      logger.error("Error occured while fetching Public Campaign = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
      logger.trace("Public Campaign got successfully = ", resp_data);
      res.status(config.OK_STATUS).json(resp_data);
    }
  }
  else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});


/**
 * @api {post} /user/campaign/myoffer My offer Campaign  - Get all
 * @apiName approved_campaign - Get all
 * @apiGroup User
 *
 * @apiHeader {String}  x-access-token unique access-key
 *
 * @apiSuccess (Success 200) {Array} Array of Offered Campaign document
 * @apiError (Error 4xx) {String} message Validation or error message.
 * 
 * changed by "ar"
 */
router.post("/myoffer", async (req, res) => {
  var schema = {
    "page_no": {
      notEmpty: true,
      errorMessage: "page_no is required"
    },
    "page_size": {
      notEmpty: true,
      errorMessage: "page_size is required"
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();

  if (!errors) {
    let filter = {};
    let sort = {};
    var redact = {};

    if (req.body.social_media_platform) {
      filter["campaign.social_media_platform"] = { "$in": req.body.social_media_platform };
    }

    if (req.body.search) {
      var r = new RegExp(req.body.search);
      var regex = { "$regex": r, "$options": "i" };
      redact = {
        "$or": [
          { "$setIsSubset": [[req.body.search], "$campaign.at_tag"] },
          { "$setIsSubset": [[req.body.search], "$campaign.hash_tag"] },
          { "$eq": [{ "$substr": ["$campaign.name", 0, -1] }, req.body.search] }
        ]
      }
    }

    if (typeof req.body.price != "undefined") {
      sort["campaign.price"] = req.body.price;
    } else {
      sort["campaign._id"] = 1;
    }

    var resp_data = await campaign_helper.get_user_offer(req.userInfo.id, filter, redact, sort, req.body.page_no, req.body.page_size);
    if (resp_data.status == 0) {
      logger.error("Error occured while fetching offer = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
      logger.trace("User's offer got successfully = ", resp_data);
      res.status(config.OK_STATUS).json(resp_data);
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

/**
 * @api {get} /user/campaign/:id Campaign  - Get by id
 * @apiName public campaign - Get by id
  * @apiGroup User
 * @apiHeader {String}  x-access-token unique access-key
 *
 * @apiSuccess (Success 200) {Array} Campaign  of Campaign document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/:campaign_id", async (req, res) => {
  campaign_id = req.params.campaign_id;
  user_id = req.userInfo.id;

  var user = await user_helper.get_user_by_id(user_id);

  // var access_token = user.User.facebook.access_token;
  // FB.setAccessToken(access_token);
  // var like = await FB.api("/105830773604182_136563987197527/likes");
  // likes = like.data.length;

  var resp_data = await campaign_helper.get_campaign_by_id(campaign_id);

  if (resp_data.status == 0) {
    res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
  } else if (resp_data.status == 2) {
    res.status(config.BAD_REQUEST).json({ "status": 0, "message": "No campaign found" });
  } else {
    if (resp_data.Campaign.price) {
      resp_data.Campaign.price = ((resp_data.Campaign.price * 70) / 100).toFixed(2);
    }

    // Count response of that campaign
    let response = await campaign_helper.get_total_people_applied_for_campaign(campaign_id);
    if (response.status === 1) {
      resp_data.Campaign.response = response.count;
    } else {
      resp_data.Campaign.response = 0;
    }

    logger.trace(" Campaign got successfully = ", resp_data);
    res.status(config.OK_STATUS).json(resp_data);
  }
});

/**
 * @api {post} /user/campaign/campaign_applied Campaign  Add
 * @apiName campaign_applied - Add
 * @apiGroup User
 *
 * @apiHeader {String}  Content-Type application/json
 * @apiHeader {String}  x-access-token  unique access-key
 * 
 * @apiParam {number} user_id User id of campaign
 * @apiParam {number} campaign_id Campaign id of campaign
 * @apiParam {String} description  description of campaign
 * @apiParam {String} [image] Image of campaign
 *
 * @apiSuccess (Success 200) {JSON} Campaign details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.post("/campaign_applied", async (req, res) => {
  var schema = {
    "campaign_id": {
      notEmpty: true,
      errorMessage: "campaign_id is required"
    },
    "desription": {
      notEmpty: true,
      errorMessage: "Description is required"
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();

  if (!errors) {
    var campaign_obj = {
      "user_id": req.userInfo.id,
      "campaign_id": req.body.campaign_id,
      "desription": (req.body.desription + " #ad")
    };

    let campaign = await campaign_helper.get_campaign_by_id(req.body.campaign_id);

    if (campaign.status === 1) {
      async.waterfall([
        function (callback) {
          //image upload
          if (req.files && req.files["image"]) {
            var file_path_array = [];
            // var files = req.files['images'];
            var file = req.files.image;
            var dir = "./uploads/campaign_applied";
            var mimetype = ["image/png", "image/jpeg", "image/jpg"];

            // assuming openFiles is an array of file names

            if (mimetype.indexOf(file.mimetype) != -1) {
              logger.trace("Uploading image");
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
              }

              extension = ".jpg";
              filename = "image_" + new Date().getTime() + extension;
              file.mv(dir + '/' + filename, async (err) => {
                if (err) {
                  logger.trace("Problem in uploading image");
                  callback({ "status": config.MEDIA_ERROR_STATUS, "err": "There was an issue in uploading image" });
                } else {
                  logger.trace("Image uploaded");

                  var thumbnail1 = await sharp(dir + '/' + filename)
                    .resize(800, 600)
                    .toFile(dir + '/800X600/' + filename);

                  var thumbnail1 = await sharp(dir + '/' + filename)
                    .resize(512, 384)
                    .toFile(dir + '/512X384/' + filename);

                  var thumbnail1 = await sharp(dir + '/' + filename)
                    .resize(100, 100)
                    .toFile(dir + '/100X100/' + filename);

                  callback(null, filename);
                }
              });
            } else {
              logger.trace("Invalid image format");
              callback({ "status": config.VALIDATION_FAILURE_STATUS, "err": "Image format is invalid" });
            }
          } else {
            logger.trace(" image required");
            callback({ "err": "Image required" });
          }
        }
      ], async (err, filename) => {
        //End image upload
        if (filename) {
          campaign_obj.image = filename;
        }

        let campaign_data = await campaign_helper.insert_campaign_applied(campaign_obj);

        if (campaign_data.status === 0) {
          logger.error("Error while inserting camapign  data = ", campaign_data);
          return res.status(config.BAD_REQUEST).json({ campaign_data });
        } else {

          // Check for already existing entry
          let campaign_user_resp = await campaign_helper.get_campaign_user(req.body.campaign_id, req.userInfo.id);
          if (campaign_user_resp.status === 1) {
            let obj = { "is_apply": true, "applied_post_id": campaign_data.campaign._id };
            let campaign_apply_update = await campaign_helper.update_campaign_user(req.userInfo.id, req.body.campaign_id, obj);
          } else {
            let obj = {
              "campaign_id": req.body.campaign_id,
              "user_id": req.userInfo.id,
              "is_apply": true
            }
            let camapign_user_insert = await campaign_helper.insert_campaign_user(obj);
          }
          return res.status(config.OK_STATUS).json({ "status": 1, "message": "Campaign applied successfully", "campaign": campaign.Campaign });
        }
      });
    } else {
      res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Invalid campaign" });
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

// /user/campaign/social_post
router.post("/social_post", async (req, res) => {
  logger.trace("social post API has been called = ", req.body);
  var schema = {
    "campaign_id": {
      notEmpty: true,
      errorMessage: "campaign id is required"
    },
    "post_id": {
      notEmpty: true,
      errorMessage: "Post id is required"
    },
    "social_media_platform": {
      notEmpty: true,
      errorMessage: "social media platform is required"
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();

  if (!errors) {

    var obj = {
      "user_id": req.userInfo.id,
      "campaign_id": req.body.campaign_id,
      "post_id": req.body.post_id,
      "social_media_platform": req.body.social_media_platform
    }

    logger.debug("Inserting into campaign post : ", obj);
    let resp_data = await campaign_post_helper.insert_campaign_post(obj);
    logger.info("campaign post resp : ", resp_data);

    if (resp_data.status === 0) {

      logger.error("Error while posting camapign data = ", resp_data);
      return res.status(config.BAD_REQUEST).json({ resp_data });

    } else {

      // Fetch campaign price

      logger.debug("Fetching campaign data by id : ", req.body.campaign_id);
      let campaign_resp = await campaign_helper.get_campaign_by_id(req.body.campaign_id);
      logger.info("campaign data : ", campaign_resp);

      logger.debug("Fetching applied campaign. User = ", req.userInfo.id);
      let applied_post = await campaign_helper.get_applied_campaign_by_user_and_campaign(req.userInfo.id, req.body.campaign_id);
      logger.info("applied post = ", applied_post);

      if (applied_post.status == 1) {

        logger.debug("Fetching transaction by post id : ", applied_post.applied_post._id);
        let transaction = await transaction_helper.get_transaction_by_applied_post_id(applied_post.applied_post.id);
        logger.info("Transaction ==> ", transaction);

        if (transaction.status == 1) {

          let twentyfive = (campaign_resp.Campaign.price * 25 / 100); // Credited to clique's account
          let five = (campaign_resp.Campaign.price * 5 / 100); // Credited to partner account, if available
          let seventy = (campaign_resp.Campaign.price * 70 / 100); // Credited to user's account

          logger.info("Deviding amount. 25% = ", twentyfive, " -- 5% = ", five, " -- 70% = ", seventy);

          // Add balance in user's wallet
          let user_resp = await user_helper.get_user_by_id(req.userInfo.id);
          logger.info("User object : ", user_resp)
          let obj = { "wallet_balance": (user_resp.User.wallet_balance) + seventy };
          let user_update = await user_helper.update_user_by_id(req.userInfo.id, obj);
          logger.info("User update resp : ", user_update);

          // Send push notification to user
          if (user_resp.state === 1 && user_resp.User) {

            // Check status and enter notification into DB
            if (user_resp.User.notification_settings && user_resp.User.notification_settings.got_paid) {

              var notification_obj = {
                "user_id": user_resp.User._id,
                "text": 'You got paid for the your campaign <b>"' + campaign_resp.Campaign.name + '"</b>',
                "image_url": campaign_resp.Campaign.cover_image,
                "is_read": false,
                "type": "got-paid"
              };
              let notification_resp = await notification_helper.insert_notification(notification_obj);
            }

            if (user_resp.User.device_token && user_resp.User.device_token.length > 0) {
              if (user_resp.User.notification_settings && user_resp.User.notification_settings.push_got_paid) {
                let notification_resp = user_resp.User.device_token.forEach(async (token) => {
                  if (token.platform && token.token) {
                    if (token.platform == "ios") {
                      await push_notification_helper.sendToIOS(token.token, {
                        "message": 'You got paid for the your campaign <b>"' + campaign_resp.Campaign.name + '"</b>'
                      });
                    } else if (token.platform == "android") {
                      await push_notification_helper.sendToAndroid(token.token, {
                        "message": 'You got paid for the your campaign <b>"' + campaign_resp.Campaign.name + '"</b>'
                      });
                    }
                  }
                });
              }
            }

          }

          // Update status in campaign_user - change posted and paid falg
          obj = {
            "is_posted": true,
            "is_paid": true
          };
          let campaign_user_update = await campaign_helper.update_campaign_user(req.userInfo.id, req.body.campaign_id, obj);
          logger.info("update campaign user : ", campaign_user_update);

          // Record user transaction
          obj = {
            "user_id": req.userInfo.id,
            "campaign_id": req.body.campaign_id,
            "price": seventy
          };
          logger.debug("Inserting user earning : ", obj);
          let earning_resp = await earning_helper.insert_user_earning(obj);
          logger.info("Earning info : ", earning_resp);

          // Check for partner registration
          if (user_resp.User.referral_id) {
            logger.info("Referral exist : ", user_resp.User.referral_id);
            // Add 5% money to promoter wallet
            let promoter_resp = await promoter_helper.get_promoter_by_id(user_resp.User.referral_id);
            logger.info("Referral profile : ", promoter_resp);
            let obj = { "wallet_balance": (promoter_resp.promoter.wallet_balance) + five };
            let promoter_update = await promoter_helper.update_promoter_by_id(user_resp.User.referral_id, obj);
            logger.info("Promoter update resp : ", promoter_update);
          }

          // Keep remianing balance in clique's account amd charge promoter
          logger.info("Capturing charge : ", transaction.transaction.cart_items.stripe_charge_id);
          let charge = await stripe.charges.capture(transaction.transaction.cart_items.stripe_charge_id);
          logger.info("captured charge resp ==> ", charge);

          // Update transaction table
          if (charge) {
            logger.info("Updating status to paid for cart_item : ", transaction.transaction.cart_items._id);
            let update_resp = await transaction_helper.update_status_of_cart_item(transaction.transaction.cart_items._id, "paid");
            logger.info("Status update resp : ", update_resp);
          } else {
            logger.info("Updating status to failed for cart_item : ", transaction.transaction.cart_items._id);
            await transaction_helper.update_status_of_cart_item(transaction.transaction.cart_items._id, "failed");
            logger.info("Status update resp : ", update_resp);
          }

          return res.status(config.OK_STATUS).json({ "status": 1, "message": "Payment has been done for post" });

        } else {
          logger.error("Transaction not found")
          res.status(config.BAD_REQUEST).status({ "status": 0, "message": "Transaction not found" });
        }
      } else {
        logger.error("Post not found");
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Post not found" });
      }
    }

  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

router.post("/social_post_new", async (req, res) => {
  logger.trace("social post API has been called = ", req.body);
  var schema = {
    "post_id": {
      notEmpty: true,
      errorMessage: "post id is required"
    },
    "post_type": {
      notEmpty: true,
      errorMessage: "post type is required"
    },
    "social_post_id": {
      notEmpty: true,
      errorMessage: "Social post id is required"
    },
    "social_media_platform": {
      notEmpty: true,
      errorMessage: "social media platform is required"
    }
  };
  req.checkBody(schema);
  var errors = req.validationErrors();

  if (!errors) {

    var obj = {
      "user_id": req.userInfo.id,
      "post_id": req.body.social_post_id,
      "social_media_platform": req.body.social_media_platform
    }

    if (req.body.post_type == "applied_post") {
      obj.campaign_id = req.body.campaign_id;
      obj.applied_post_id = req.body.post_id
    } else if (req.body.post_type == "inspired_post") {
      obj.inspired_post_id = req.body.post_id
    }

    logger.debug("Inserting into campaign post : ", obj);
    let resp_data = await campaign_post_helper.insert_campaign_post(obj);
    logger.info("campaign post resp : ", resp_data);

    if (resp_data.status === 0) {
      logger.error("Error while posting camapign data = ", resp_data);
      return res.status(config.BAD_REQUEST).json({ resp_data });

    } else {

      // Fetch campaign price
      if (req.body.campaign_id) {

        logger.debug("Fetching campaign data by id : ", req.body.campaign_id);
        let campaign_resp = await campaign_helper.get_campaign_by_id(req.body.campaign_id);
        logger.info("campaign data : ", campaign_resp);

        logger.debug("Fetching applied campaign. User = ", req.userInfo.id);
        let applied_post = await campaign_helper.get_applied_campaign_by_user_and_campaign(req.userInfo.id, req.body.campaign_id);
        logger.info("applied post = ", applied_post);

        if (applied_post.status == 1) {

          logger.debug("Fetching transaction by post id : ", applied_post.applied_post._id);
          let transaction = await transaction_helper.get_transaction_by_applied_post_id(applied_post.applied_post.id);
          logger.info("Transaction ==> ", transaction);

          if (transaction.status == 1) {

            let twentyfive = (campaign_resp.Campaign.price * 25 / 100); // Credited to clique's account
            let five = (campaign_resp.Campaign.price * 5 / 100); // Credited to partner account, if available
            let seventy = (campaign_resp.Campaign.price * 70 / 100); // Credited to user's account

            logger.info("Deviding amount. 25% = ", twentyfive, " -- 5% = ", five, " -- 70% = ", seventy);

            // Add balance in user's wallet
            let user_resp = await user_helper.get_user_by_id(req.userInfo.id);
            logger.info("User object : ", user_resp)
            let obj = { "wallet_balance": (user_resp.User.wallet_balance) + seventy };
            let user_update = await user_helper.update_user_by_id(req.userInfo.id, obj);
            logger.info("User update resp : ", user_update);

            // Send push notification to user
            if (user_resp.state === 1 && user_resp.User) {

              // Check status and enter notification into DB
              if (user_resp.User.notification_settings && user_resp.User.notification_settings.got_paid) {

                var notification_obj = {
                  "user_id": user_resp.User._id,
                  "text": 'You got paid for the your campaign <b>"' + campaign_resp.Campaign.name + '"</b>',
                  "image_url": campaign_resp.Campaign.cover_image,
                  "is_read": false,
                  "type": "got-paid"
                };
                let notification_resp = await notification_helper.insert_notification(notification_obj);
              }

              if (user_resp.User.device_token && user_resp.User.device_token.length > 0) {
                if (user_resp.User.notification_settings && user_resp.User.notification_settings.push_got_paid) {
                  let notification_resp = user_resp.User.device_token.forEach(async (token) => {
                    if (token.platform && token.token) {
                      if (token.platform == "ios") {
                        await push_notification_helper.sendToIOS(token.token, {
                          "message": 'You got paid for the your campaign <b>"' + campaign_resp.Campaign.name + '"</b>'
                        });
                      } else if (token.platform == "android") {
                        await push_notification_helper.sendToAndroid(token.token, {
                          "message": 'You got paid for the your campaign <b>"' + campaign_resp.Campaign.name + '"</b>'
                        });
                      }
                    }
                  });
                }
              }

            }

            // Update status in campaign_user - change posted and paid falg
            obj = {
              "is_posted": true,
              "is_paid": true
            };
            let campaign_user_update = await campaign_helper.update_campaign_user(req.userInfo.id, req.body.campaign_id, obj);
            logger.info("update campaign user : ", campaign_user_update);

            // Record user transaction
            obj = {
              "user_id": req.userInfo.id,
              "campaign_id": req.body.campaign_id,
              "price": seventy
            };
            logger.debug("Inserting user earning : ", obj);
            let earning_resp = await earning_helper.insert_user_earning(obj);
            logger.info("Earning info : ", earning_resp);

            // Check for partner registration
            if (user_resp.User.referral_id) {
              logger.info("Referral exist : ", user_resp.User.referral_id);
              // Add 5% money to promoter wallet
              let promoter_resp = await promoter_helper.get_promoter_by_id(user_resp.User.referral_id);
              logger.info("Referral profile : ", promoter_resp);
              let obj = { "wallet_balance": (promoter_resp.promoter.wallet_balance) + five };
              let promoter_update = await promoter_helper.update_promoter_by_id(user_resp.User.referral_id, obj);
              logger.info("Promoter update resp : ", promoter_update);
            }

            // Keep remianing balance in clique's account amd charge promoter
            logger.info("Capturing charge : ", transaction.transaction.cart_items.stripe_charge_id);
            let charge = await stripe.charges.capture(transaction.transaction.cart_items.stripe_charge_id);
            logger.info("captured charge resp ==> ", charge);

            // Update transaction table
            if (charge) {
              logger.info("Updating status to paid for cart_item : ", transaction.transaction.cart_items._id);
              let update_resp = await transaction_helper.update_status_of_cart_item(transaction.transaction.cart_items._id, "paid");
              logger.info("Status update resp : ", update_resp);
            } else {
              logger.info("Updating status to failed for cart_item : ", transaction.transaction.cart_items._id);
              await transaction_helper.update_status_of_cart_item(transaction.transaction.cart_items._id, "failed");
              logger.info("Status update resp : ", update_resp);
            }

            return res.status(config.OK_STATUS).json({ "status": 1, "message": "Payment has been done for post" });

          } else {
            logger.error("Transaction not found")
            res.status(config.BAD_REQUEST).status({ "status": 0, "message": "Transaction not found" });
          }
        } else {
          logger.error("Post not found");
          res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Post not found" });
        }

      }

    }

  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

/**
 * Not in used
 * Marked by "ar"
 */

// router.post('/share/:campaign_id', async (req, res) => {

//   // access token get
//   user_id = req.userInfo.id;
//   logger.trace("Get all Profile API called");
//   var user = await user_helper.get_user_by_id(user_id);

//   var access_token = user.User.facebook.access_token;

//   // Get campaign details by campaign id
//   campaign_id = req.params.campaign_id;
//   logger.trace("Get all Campaign API called");
//   var campaign_data = await campaign_helper.get_campaign_by_id(campaign_id);
//   var caption = campaign_data.Campaign.name + ' - ' + campaign_data.Campaign.description;

//   try {

//     FB.setAccessToken(access_token);
//     var images = [];

//     console.log("image = ", config.base_url + '/uploads/campaign/' + campaign_data.Campaign.cover_image);

//     // Add cover images
//     var cover_image_id = await FB.api('me/photos', 'post', { url: config.base_url + '/uploads/campaign/' + campaign_data.Campaign.cover_image, caption: caption, published: false });
//     images.push({ "media_fbid": cover_image_id.id });

//     if (campaign_data.Campaign.mood_board_images && campaign_data.Campaign.mood_board_images.length > 0) {
//       async.waterfall([
//         function (callback) {
//           async.eachSeries(campaign_data.Campaign.mood_board_images, function (image, loop_callback) {

//             FB.api('me/photos', 'post', { url: config.base_url + '/uploads/campaign/' + image, caption: caption, published: false }, function (resp) {
//               console.log("media_fbid = ", resp.id);
//               images.push({ "media_fbid": resp.id });
//               loop_callback();
//             });
//           }, async (err) => {
//             if (err) {
//               callback(err);
//             } else {
//               callback(null);
//             }
//           });
//         }
//       ], async (err, resp) => {
//         if (err) {
//           console.log("error = ", err);
//           res.status(500).send("error in uploading images");
//         } else {
//           var post_id = await FB.api('me/feed', 'post', { attached_media: images, message: caption });
//           console.log("post resp = ", post_id);
//           var campaign_obj = {
//             "user_id": user_id,
//             "campaign_id": campaign_id,
//             "post_id": post_id
//           };
//           let campaign_data = await campaign_post_helper.insert_campaign_post(campaign_obj);

//           user_id = campaign_obj.user_id;
//           campaign_id = campaign_obj.post_id;
//           var obj = { "is_posted": true };

//           let campaign_post_update = await campaign_helper.update_campaign_user(user_id, campaign_id, obj);
//           return res.status(config.OK_STATUS).json(campaign_data);
//         }
//       });

//     }
//   } catch (error) {
//     res.status(500).send({ "Error": error });
//   }
// });


router.post('/share/twitter/:campaign_id', async (req, res) => {
  // Get campaign details by campaign id
  campaign_id = req.params.campaign_id;
  var mood_board_image = [];
  var cover_image = [];
  user_id = req.userInfo.id;
  logger.trace("Get all Profile API called");
  var user = await user_helper.get_user_by_id(user_id);
  // var access_token = user.User.twitter.access_token;

  // Get campaign details by campaign id
  campaign_id = req.params.campaign_id;
  logger.trace("Get all  Campaign API called");
  var campaign_data = await campaign_helper.get_campaign_by_id(campaign_id);
  var caption = campaign_data.Campaign.name + ' - ' + campaign_data.Campaign.description;


  var client = new Twitter({
    consumer_key: 'HMZWrgFh4A9hhoWhZdkPS1IyO',
    consumer_secret: '10kLAI5ybuC1AxY7WmdHDba2r9uCN4k6LYbvGhSNHr9Igq7uZy',
    access_token_key: '981822054855933952-TACqTt4v8J4dAFUv8jDMmT9a2QC0VAN',
    access_token_secret: 'PKhVyKslUSxhXVe0hA2UbQNfpo3ugx79fumaPBApc4gVm'
  });
  var images = [];
  async.parallel([
    function (cover) {
      fs.readFile('./uploads/campaign/' + campaign_data.Campaign.cover_image, (err, data) => {
        if (err) throw err;
        client.post('media/upload', { media: data }, function (error, media, response) {
          console.log("Medias", media);

          cover_image = media.media_id_string;

          cover(null, cover_image);
        })
      });
    },
    function (board) {
      if (campaign_data.Campaign.mood_board_images && campaign_data.Campaign.mood_board_images.length > 0) {
        var img = [];
        async.eachSeries(campaign_data.Campaign.mood_board_images, function (image, loop_callback) {
          fs.readFile('./uploads/campaign/' + campaign_data.Campaign.mood_board_images, (err, data) => {
            if (err) throw err;
            client.post('media/upload', { media: data }, function (error, media, response) {
              img.push(media.media_id_string);
              loop_callback();
            })
          });
        }, async (err) => {
          if (err) {
            board(err);
          } else {
            board(null, img);
          }
        });
      }
    }
  ],
    // optional callback
    function (err, results) {
      console.log("cover image = ", results[0]);
      console.log("Mood Board image = ", results[1]);

      var arr = [results[0]].concat(results[1]);


      var status = {
        status: 'I am a tweet',
        media_ids: arr.join()
      }
      client.post('statuses/update', status, async (error, tweet, response) => {
        console.log("media_ids ", status.media_ids);
        media_id = status.media_ids;

        var campaign_obj = {
          "user_id": user_id,
          "campaign_id": campaign_id,
          "post_id": media_id
        };

        console.log("campaign post", campaign_obj);

        let campaign_data = await campaign_post_helper.insert_campaign_post(campaign_obj);

        user_id = campaign_obj.user_id;
        campaign_id = campaign_obj.campaign_id;

        var obj = { "is_posted": true };

        let campaign_post_update = await campaign_helper.update_campaign_user(user_id, campaign_id, obj);
        return res.status(config.OK_STATUS).json(campaign_data);
      })
    });

});

router.post('/share/pinterest/:campaign_id', async (req, res) => {
  // Get campaign details by campaign id
  campaign_id = req.params.campaign_id;
  var mood_board_image = [];
  var cover_image = [];
  user_id = req.userInfo.id;
  logger.trace("Get all Profile API called");
  var user = await user_helper.get_user_by_id(user_id);
  // var access_token = user.User.twitter.access_token;

  // Get campaign details by campaign id
  campaign_id = req.params.campaign_id;
  logger.trace("Get all  Campaign API called");
  var campaign_data = await campaign_helper.get_campaign_by_id(campaign_id);
  var caption = campaign_data.Campaign.name + ' - ' + campaign_data.Campaign.description;


  var client = new Twitter({
    consumer_key: 'HMZWrgFh4A9hhoWhZdkPS1IyO',
    consumer_secret: '10kLAI5ybuC1AxY7WmdHDba2r9uCN4k6LYbvGhSNHr9Igq7uZy',
    access_token_key: '981822054855933952-TACqTt4v8J4dAFUv8jDMmT9a2QC0VAN',
    access_token_secret: 'PKhVyKslUSxhXVe0hA2UbQNfpo3ugx79fumaPBApc4gVm'
  });
  var images = [];
  async.parallel([
    function (cover) {
      fs.readFile('./uploads/campaign/' + campaign_data.Campaign.cover_image, (err, data) => {
        if (err) throw err;
        client.post('media/upload', { media: data }, function (error, media, response) {
          console.log("Medias", media);

          cover_image = media.media_id_string;

          cover(null, cover_image);
        })
      });
    },
    function (board) {
      if (campaign_data.Campaign.mood_board_images && campaign_data.Campaign.mood_board_images.length > 0) {
        var img = [];
        async.eachSeries(campaign_data.Campaign.mood_board_images, function (image, loop_callback) {
          fs.readFile('./uploads/campaign/' + campaign_data.Campaign.mood_board_images, (err, data) => {
            if (err) throw err;
            client.post('media/upload', { media: data }, function (error, media, response) {
              img.push(media.media_id_string);
              loop_callback();
            })
          });
        }, async (err) => {
          if (err) {
            board(err);
          } else {
            board(null, img);
          }
        });
      }
    }
  ],
    // optional callback
    function (err, results) {
      console.log("cover image = ", results[0]);
      console.log("Mood Board image = ", results[1]);

      var arr = [results[0]].concat(results[1]);


      var status = {
        status: 'I am a tweet',
        media_ids: arr.join()
      }
      client.post('statuses/update', status, async (error, tweet, response) => {
        console.log("media_ids ", status.media_ids);
        media_id = status.media_ids;
        var campaign_obj = {
          "user_id": user_id,
          "campaign_id": campaign_id,
          "post_id": media_id
        };

        //console.log(user_id);

        let campaign_data = await campaign_post_helper.insert_campaign_post(campaign_obj);

        user_id = campaign_obj.user_id;
        campaign_id = campaign_obj.campaign_id;

        var obj = { "is_posted": true };

        let campaign_post_update = await campaign_helper.update_campaign_user(user_id, campaign_id, obj);
        return res.status(config.OK_STATUS).json(campaign_data);
      })
    });
});

router.post("/", async (req, res) => {
  var filter = {};
  var page_no = {};
  var page_size = {};

  var schema = {
    "page_no": {
      notEmpty: true,
      errorMessage: "page_no is required"
    },
    "page_size": {
      notEmpty: true,
      errorMessage: "page_size is required"
    },

  };
  req.checkBody(schema);
  var errors = req.validationErrors();

  if (typeof req.body.filter != "undefined") {
    filter["company"] = req.body.filter;
  }

  if (!errors) {
    user_id = req.userInfo.id;

    var resp_data = await promoter_helper.get_filtered_campaign(req.body.filter, user_id);
    if (resp_data.status == 0) {
      logger.error("Error occured while fetching Brand = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
      logger.trace("Brand got successfully = ", resp_data);
      res.status(config.OK_STATUS).json(resp_data);
    }
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});



















/*
var pinIt = new PinIt({
 username: 'blakehrowley',
 userurl:  'http://www.pinterest.com/blakehrowley/',
 password: 'tECHWITTY123'
});
pinIt.createBoard({
 boardName: 'Campaign',
 description: ' board of campaign',
 boardCategory:  'geek',  
 boardPrivacy:  'public'   
 
}, function(err, pinObj) {
 if(err) {
   
     console.log(err);
     return;
 }

 console.log('Success!  The board has been created.');
 
})
pinterest.api('me/boards').then(function(json) {
 console.log(json);
 pinterest.api('pins', {
     method: 'POST',
     body: {
         board: '801148289901861085', // grab the first board from the previous response
         note: 'this is a test1',
         image_url: 'http://i.kinja-img.com/gawker-media/image/upload/s--4Vp0Ks1S--/1451895062187798055.jpg'
     }
 }).then(function(json) {
     pinterest.api('me/pins').then(console.log);
 });
});*/

/*
request.post({
  "url": 'https://www.linkedin.com/oauth/v2/accessToken',
  "headers": {'content-type':'application/x-www-form-urlencoded'},
  "body": {
    "client_id": "81o2b6x3ddegiv",
    "grant_type": "authorization_code",
    "code": "AQRqqdPHFOSe6OW-iSyL8r1noIzN8-FfbUPfdCpiBV6MsbiO3J0b6z-93aIshORIaEOefg0zLFfDBEf3cnF6oj3oPHjxfqgAyORh_7txfR7lRUONLalcGdPLbJ1In_2xayUbcW6IvVqS3CR34D9MqX-Gg1AdcQ&state=DCEeFWf45A53sdfKef424",
    "redirect_uri": "http://13.55.64.183:8080",
    "client_secret": "as2ICfiyNX87vvZc"
  },
  json: true
}, function (error, response, body) {
  //console.log(response);
  console.log(body);
  // console.log(error);
});*/








/*request.get('/oauth/linkedin/callback', function(req, res) {
  Linkedin.auth.getAccessToken('AQRqqdPHFOSe6OW-iSyL8r1noIzN8-FfbUPfdCpiBV6MsbiO3J0b6z-93aIshORIaEOefg0zLFfDBEf3cnF6oj3oPHjxfqgAyORh_7txfR7lRUONLalcGdPLbJ1In_2xayUbcW6IvVqS3CR34D9MqX-Gg1AdcQ&state=DCEeFWf45A53sdfKef424', function(err, results) {
      if ( err )
          return console.error(err);
      console.log(results);
     
  });
});*/

module.exports = router;
