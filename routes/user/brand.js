var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");

var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var promoter_helper = require("./../../helpers/promoter_helper");



/**
 * @api {get} /user/promoter Brand  - Get 
 * @apiName Brand - Get all
  * @apiGroup User
 * @apiHeader {String}  x-access-token unique access-key
 *
 * @apiSuccess (Success 200) {Array} brand Array of brand document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
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

 if(!errors)
 {
    logger.trace("Get all Brand API called");
    var resp_data = await promoter_helper.get_all_brand(req.body.filter,req.body.page_no, req.body.page_size);
    if (resp_data.status == 0) {
      logger.error("Error occured while fetching Brand = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
      logger.trace("Brand got successfully = ", resp_data);
      res.status(config.OK_STATUS).json(resp_data);
    }
  }else{
    logger.error("Validation Error = ", errors);
    res.status(config.BAD_REQUEST).json({ message: errors });
  }
  });


  
/* *
 * @api {post} /user/promoter/inspired_submission Brand Add
 * @apiName Brand - Add
/**
  * @apiGroup User
 * @apiHeader {String}  x-access-token unique access-key 
 * @apiHeader {String}  Content-Type application/json
 * @apiHeader {String}  x-access-token  unique access-key
 * 
 * @apiParam {String} name Name of comapny
 * @apiParam {String}  Image  image of company
 * @apiParam {String}  text  text of company
 * @apiParam {String}  price  price of company
 
 * @apiSuccess (Success 200) {JSON} inspired Inspired details
 * @apiError (Error 4xx) {String} message Validation or error message.
 * */

  router.post("/inspired_submission", async (req, res) => {
   
      
    var schema = {
      company: {
        notEmpty: true,
        errorMessage: "company is required"
      },
      text: {
        notEmpty: true,
        errorMessage: "Text is required"
      },
      price: {
        notEmpty: true,
        errorMessage: "price is required"
      },
      social_media_platform: {
        notEmpty: true,
        errorMessage: "Social media platform is required"
      }
    };
    req.checkBody(schema);
    var errors = req.validationErrors();
  
    if (!errors) {
     
      var inspire_obj = {
        company: req.body.company,
        text: req.body.text,
        price: req.body.price,
        social_media_platform : req.body.social_media_platform
      };
  
      //console.log(inspire_obj);
     
      async.waterfall(
        [
          function(callback) {
            //image upload
            if (req.files && req.files["image"]) {
              var file_path_array = [];
              // var files = req.files['images'];
              var file =req.files.image;
              var dir = "./uploads/inspired_submission";
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
                        callback({"status": config.MEDIA_ERROR_STATUS, "err": "There was an issue in uploading image"});
                    } else {
                        logger.trace("Image uploaded");
                        callback(null, filename);
                    }
                });
            } else {
                logger.trace("Invalid image format");
                callback({"status": config.VALIDATION_FAILURE_STATUS, "err": "Image format is invalid"});
            }
        } else {
            logger.trace("Avatar is not available");
            callback(null, user, null);
        }
            }
         
        ],
        async (err,user, filename) => {
          //End image upload
         
          if(filename)
          {
            inspire_obj.image = filename;
          }
          
          let inspire_data = await promoter_helper.insert_inspired_brand(inspire_obj);
          if (inspire_data.status === 0) {
            logger.error("Error while inserting Inspire  data = ", inspire_data);
            return res.status(config.BAD_REQUEST).json({ inspire_data });
          } else {
            return res.status(config.OK_STATUS).json(inspire_data);
          }
        }
      );
    } else {
      logger.error("Validation Error = ", errors);
      res.status(config.BAD_REQUEST).json({ message: errors });
    }
  });
  

module.exports = router;