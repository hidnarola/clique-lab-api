var express = require("express");
var router = express.Router();

var config = require('./../../config');
var faq_helper = require('./../../helpers/faq_helper');

/** 
 * @api {get} /promoter/faq Get all faq
 * @apiName Get all faq
 * @apiGroup Promoter-FAQ
 * 
 * @apiDescription  Get all faq
 * 
 * @apiHeader {String}  x-access-token promoter's unique access-key
 * @apiHeader {String}  Content-Type application/json
 * 
 * @apiSuccess (Success 200) {JSON} results Faqs details
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/', async (req, res) => {
    var faqs_resp = await faq_helper.get_faqs();
    if (faqs_resp.status === 1) {
        res.status(config.OK_STATUS).json({ "status": 1, "message": "Faqs found", "results": faqs_resp.faqs });
    } else {
        res.status(config.BAD_REQUEST).json({ "status": 0, "message": "Faq not found" });
    }
});

module.exports = router;