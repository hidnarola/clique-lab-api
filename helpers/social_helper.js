var FB = require('fb');
var social_helper = {};

social_helper.get_facebook_friends_by_token = async(access_token) => {
    try{
        FB.setAccessToken(access_token);
        let response = await FB.api('/me/friends');
        return {"status":1,"message":"Facebook friends found","friends":response};
    } catch(err){
        return {"status":0,"message":"Error while finding facebook friends","error":err};
    }
}

module.exports = social_helper;