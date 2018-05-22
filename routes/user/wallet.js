var express = require("express");
var router = express.Router();

var config = require("./../../config");
var logger = config.logger;

var user_helper = require("./../../helpers/user_helper");

/**
 * /user/wallet/balance
 * Get wallet balance of logged-in user
 * Developed by "ar"
 */
router.get('/balance', async (req, res) => {
    try{
        let user_resp = await user_helper.get_user_by_id(req.userInfo.id);
        if(user_resp.status === 1){
            if(user_resp.User.wallet_balance === undefined){
                user_resp.User.wallet_balance = 0;
            }
            res.status(config.OK_STATUS).json({"status":1,"message":"Wallet balance has been found","wallet_balance":user_resp.User.wallet_balance});
        } else if(user_resp.status === 2){
            res.status(config.BAD_REQUEST).json({"status":0,"message":"No user available"});
        } else {
            res.status(config.INTERNAL_SERVER_ERROR).json({"status":0,"message":"Error has occured while finding wallat balance for user","error":user_resp.error});
        }
    } catch(err){
        res.status(config.INTERNAL_SERVER_ERROR).json({"status":0,"message":"Error has occured while finding wallat balance for user","error":err});
    }
});

module.exports = router;