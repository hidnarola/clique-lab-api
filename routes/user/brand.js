var express = require("express");
var fs = require("fs");
var path = require("path");
var async = require("async");

var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var promoter_helper = require("./../../helpers/promoter_helper");
//var inspiredBrand=require("./../../helpers/promoter_helper");


/**
 * @api {get} user/campaign/brand Interest  - Get all
 * @apiName get_all_brand - Get all

 *
 * @apiHeader {String}  x-access-token  unique access-key
 *
 * @apiSuccess (Success 200) {Array}  Array of Brand document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/brand", async (req, res) => {

    logger.trace("Get all Brand API called");
    var resp_data = await promoter_helper.get_all_brand();
    if (resp_data.status == 0) {
      logger.error("Error occured while fetching Brand = ", resp_data);
      res.status(config.INTERNAL_SERVER_ERROR).json(resp_data);
    } else {
      logger.trace("Brand got successfully = ", resp_data);
      res.status(config.OK_STATUS).json(resp_data);
    }
  });


  /**
 * @api {post} /user/brand Brand Add
 * @apiName Brand  Add

 * 
 * @apiHeader {String}  Content-Type application/json
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * 
 * @apiParam {String} name Name of comapny
 * @apiParam {String} [description] Description of company
 
 * @apiSuccess (Success 200) {JSON} inspired Inspired details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
  router.post("/brand", async (req, res) => {
   
      
    var schema = {
      company: {
        notEmpty: true,
        errorMessage: "company is required"
      },
      image: {
        notEmpty: false,
        errorMessage: "Image is required"
      },
      text: {
        notEmpty: true,
        errorMessage: "Text is required"
      },
      Price: {
        notEmpty: false,
        errorMessage: "price is required"
      },
     
    };
    req.checkBody(schema);
    var errors = req.validationErrors();
  
    if (!errors) {
     
      var inspire_obj = {
        company: req.body.company,
        text: req.body.text,
        price: req.body.price
      };
  
      //console.log(inspire_obj);
     
      async.waterfall(
        [
          function(callback) {
            //image upload
            if (req.files && req.files["image"]) {
              var file_path_array = [];
              // var files = req.files['images'];
              var files = [].concat(req.files.image);
              var dir = "./uploads/inspired_brands";
              var mimetype = ["image/png", "image/jpeg", "image/jpg"];
  
              // assuming openFiles is an array of file names
              async.eachSeries(
                files,
                function(file, loop_callback) {
                  var mimetype = ["image/png", "image/jpeg", "image/jpg"];
                  if (mimetype.indexOf(file.mimetype) != -1) {
                    if (!fs.existsSync(dir)) {
                      fs.mkdirSync(dir);
                    }
                    extention = path.extname(file.name);
                    filename = "image" + new Date().getTime() + extention;
                    file.mv(dir + "/" + filename, function(err) {
                      if (err) {
                        logger.error("There was an issue in uploading image");
                        loop_callback({
                          status: config.MEDIA_ERROR_STATUS,
                          err: "There was an issue in uploading image"
                        });
                      } else {
                        logger.trace(
                          "image has been uploaded. Image name = ",
                          filename
                        );
                        location = "uploads/inspired_brands/" + filename;
                        file_path_array.push(location);
                        loop_callback();
                      }
                    });
                  } else {
                    logger.error("Image format is invalid");
                    loop_callback({
                      status: config.VALIDATION_FAILURE_STATUS,
                      err: "Image format is invalid"
                    });
                  }
                },
                function(err) {
                  // if any of the file processing produced an error, err would equal that error
                  if (err) {
                    res.status(err.status).json(err);
                  } else {
                    callback(null, file_path_array);
                  }
                }
              );
            } else {
              logger.info(
                "Image not available to upload. Executing next instruction"
              );
              callback(null, []);
            }
          }
        ],
        async (err, file_path_array) => {
          //End image upload
          if(file_path_array)
          {
            inspire_obj.image = file_path_array;
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