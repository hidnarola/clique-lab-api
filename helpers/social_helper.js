var FB = require('fb');
var social_helper = {};

social_helper.get_facebook_friends_by_token = async(access_token) => {
    try{
        FB.setAccessToken(access_token);
        let response = await FB.api('/me/friends');
        if(response.summary.total_count > 0){
            return response.summary.total_count;
        } else {
            return 0;
        }
    } catch(err){
        return 0;
    }
}

module.exports = social_helper;