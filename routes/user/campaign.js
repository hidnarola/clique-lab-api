var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");
var FB = require('fb');

var router = express.Router();

var config = require("./../../config");
var logger = config.logger;
var PinIt = require('pin-it-node');

var campaign_helper = require("./../../helpers/campaign_helper");
var user_helper = require("./../../helpers/user_helper");
var campaign_post_helper = require("./../../helpers/campaign_post_helper");
var PDK = require('node-pinterest');
var pinterest = PDK.init('AYSihE_YGAfDVXbYU3P7e85xncTzFSaDpm_8EORE2WRMweA4YAAAAAA');
var PinIt = require('pin-it-node');
var Twitter = require('twitter');
var parallel = require('async/parallel');
var randomstring = require("randomstring");
var request = require("request");

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
  user_id = req.userInfo.id;
  logger.trace("Get all campaign API called");
  var filter = {};
  var sort = {};
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

  if (!errors) {
    console.log("2");
    if (req.body.social_media_platform) {
      filter["social_media_platform"] = req.body.social_media_platform;
    }

    if (typeof req.body.price != "undefined") {
      sort["price"] = req.body.price;
    }
    if (typeof req.body.page_no) {
      page_no = req.body.page_no;
    }
    if (typeof req.body.page_size) {
      page_size = req.body.page_size;
    }

    var resp_data = await campaign_helper.get_campaign_by_user_id(user_id, filter, page_no, page_size);
    console.log("4");
    if (resp_data.status == 0) {
      logger.error("Error occured while fetching campaign = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    }
    else {
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
  var filter = {};
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
      console.log("search = ", req.body.search);
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



    var resp_data = await campaign_helper.get_all_campaign(filter, redact, sort, req.body.page_no, req.body.page_size);
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
 */
router.post("/myoffer", async (req, res) => {

  user_id = req.userInfo.id;
  console.log(user_id);
  logger.trace("Get all campaign API called");
  var filter = {};
  var sort = {};
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

  if (!errors) {
    console.log("2");
    if (req.body.social_media_platform) {
      filter["social_media_platform"] = req.body.social_media_platform;
    }

    if (typeof req.body.price != "undefined") {
      sort["price"] = req.body.price;
    }
    if (typeof req.body.search != "undefined") {
      filter["search"] = req.body.search;
    }
    if (typeof req.body.page_no) {
      page_no = req.body.page_no;
    }
    if (typeof req.body.page_size) {
      page_size = req.body.page_size;
    }
    console.log("3");

    var resp_data = await campaign_helper.get_all_offered_campaign(user_id, filter, sort, page_no, page_size);
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
  logger.trace("Get all  Campaign API called");
  var resp_data = await campaign_helper.get_campaign_by_id(campaign_id);
  if (resp_data.status == 0) {
    logger.error("Error occured while fetching Public Campaign = ", resp_data);
    res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
  } else {
    logger.trace(" Campaign got successfully = ", resp_data);
    res.status(config.OK_STATUS).json(resp_data);
  }
});

/**
 * @api {post} /user/campaign/campaign_applied Campaign  Add
 * @apiName campaign_applied - Add
 * @apiGroup User

 * @apiHeader {String}  Content-Type application/json
 * @apiHeader {String}  x-access-token  unique access-key
 * @apiParam {number} user_id User id of campaign
 * @apiParam {number} campaign_id Campaign id of campaign
 *  @apiParam {String} description  description of campaign
 *  @apiParam {String} [image] Image of campaign

 * @apiSuccess (Success 200) {JSON}Campaign details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.post("/campaign_applied", async (req, res) => {
  var schema = {
    "user_id": {
      notEmpty: true,
      errorMessage: "user_id is required"
    },
    "campaign_id": {
      notEmpty: true,
      errorMessage: "campaign_id is required"
    },
    "desription": {
      notEmpty: true,
      errorMessage: "Description is required"
    },

  };
  req.checkBody(schema);
  var errors = req.validationErrors();

  if (!errors) {

    var campaign_obj = {
      "user_id": req.body.user_id,
      "campaign_id": req.body.campaign_id,
      "desription": req.body.desription,

    };

    var campaign_id = campaign_obj.campaign_id;
    var user_id = campaign_obj.user_id;
    async.waterfall(
      [
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
              file.mv(dir + '/' + filename, function (err) {
                if (err) {
                  logger.trace("Problem in uploading image");
                  callback({ "status": config.MEDIA_ERROR_STATUS, "err": "There was an issue in uploading image" });
                } else {
                  logger.trace("Image uploaded");
                  callback(null, filename);
                }
              });
            } else {
              logger.trace("Invalid image format");
              callback({ "status": config.VALIDATION_FAILURE_STATUS, "err": "Image format is invalid" });
            }

          }
          else {
            logger.trace(" image required");
            callback({ "err": "Image required" });

          }
        }

      ],
      async (err, filename) => {
        //End image upload

        if (filename) {
          campaign_obj.image = filename;
        }
        /*var random = randomstring.generate(6);
        console.log(random);*/

        let campaign_data = await campaign_helper.insert_campaign_applied(campaign_obj);


        if (campaign_data.status === 0) {
          logger.error("Error while inserting camapign  data = ", campaign_data);
          return res.status(config.BAD_REQUEST).json({ campaign_data });
        } else {
          var obj = { "is_apply": true };

          let campaign_apply_update = await campaign_helper.update_campaign_by_user(user_id, campaign_id, obj);

          return res.status(config.OK_STATUS).json(campaign_data);
        }

      }
    );
  } else {
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
});

// /user/campaign/share/:campaign_id

router.post('/share/:campaign_id', async (req, res) => {

  // access token get
  user_id = req.userInfo.id;
  logger.trace("Get all Profile API called");
  var user = await user_helper.get_user_by_id(user_id);

  var access_token = user.User.facebook.access_token;

  // Get campaign details by campaign id
  campaign_id = req.params.campaign_id;
  logger.trace("Get all  Campaign API called");
  var campaign_data = await campaign_helper.get_campaign_by_id(campaign_id);
  var caption = campaign_data.Campaign.name + ' - ' + campaign_data.Campaign.description;


  try {

    FB.setAccessToken(access_token);
    var images = [];

    console.log("image = ", config.base_url + '/uploads/campaign/' + campaign_data.Campaign.cover_image);

    // Add cover images
    var cover_image_id = await FB.api('me/photos', 'post', { url: config.base_url + '/uploads/campaign/' + campaign_data.Campaign.cover_image, caption: caption, published: false });
    images.push({ "media_fbid": cover_image_id.id });

    if (campaign_data.Campaign.mood_board_images && campaign_data.Campaign.mood_board_images.length > 0) {
      async.waterfall([
        function (callback) {
          async.eachSeries(campaign_data.Campaign.mood_board_images, function (image, loop_callback) {

            FB.api('me/photos', 'post', { url: config.base_url + '/uploads/campaign/' + image, caption: caption, published: false }, function (resp) {
              console.log("media_fbid = ", resp.id);
              images.push({ "media_fbid": resp.id });
              loop_callback();
            });
          }, async (err) => {
            if (err) {
              callback(err);
            } else {
              callback(null);
            }
          });
        }
      ], async (err, resp) => {
        if (err) {
          console.log("error = ", err);
          res.status(500).send("error in uploading images");
        } else {
          var post_id = await FB.api('me/feed', 'post', { attached_media: images, message: caption });
          console.log("post resp = ", post_id);
          var campaign_obj = {
            "user_id": user_id,
            "campaign_id": campaign_id,
            "post_id": post_id
          };
          let campaign_data = await campaign_post_helper.insert_campaign_post(campaign_obj);

          user_id = campaign_obj.user_id;
          campaign_id = campaign_obj.post_id;
          var obj = { "is_posted": true };

          let campaign_post_update = await campaign_helper.update_campaign_by_user(user_id, campaign_id, obj);
          return res.status(config.OK_STATUS).json(campaign_data);
        }
      });

    }
  } catch (error) {
    res.status(500).send({ "Error": error });
  }
});

router.get('/share/facefook/friends', async (req, res) => {
  user_id = req.userInfo.id;
  logger.trace("Get all Profile API called");
  var user = await user_helper.get_user_by_id(user_id);

  var access_token = user.User.facebook.access_token;

FB.setAccessToken(access_token);
FB.api('/me/friends', function(response) {
  return res.status(config.OK_STATUS).json(response);
})
});


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

        let campaign_post_update = await campaign_helper.update_campaign_by_user(user_id, campaign_id, obj);
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

        let campaign_post_update = await campaign_helper.update_campaign_by_user(user_id, campaign_id, obj);
        return res.status(config.OK_STATUS).json(campaign_data);
      })
    });

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
