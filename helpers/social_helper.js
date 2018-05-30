var FB = require('fb');
var Twitter = require('twitter');

var config = require("./../config");

var Linkedin = require('node-linkedin')(config.LINKEDIN_APP_ID, config.LINKEDIN_APP_SECRET);

var social_helper = {};


social_helper.get_facebook_friends_by_token = async (access_token) => {
    try {
        FB.setAccessToken(access_token);
        let response = await FB.api('/me/friends');
        if (response.summary.total_count > 0) {
            return response.summary.total_count;
        } else {
            return 0;
        }
    } catch (err) {
        return 0;
    }
}

social_helper.get_instagram_friends_by_token = async (access_token) => {
    try {
        return 0;
    } catch (err) {
        return 0;
    }
}

social_helper.get_twitter_friends_by_token = (access_token,access_token_secret) => {
    try {
        var client = new Twitter({
            consumer_key: config.TWITTER_APP_ID,
            consumer_secret: config.TWITTER_APP_SECRET,
            access_token_key: access_token,
            access_token_secret: access_token_secret
        });

        var promise = new Promise(function(resolve, reject) {
            client.get('account/verify_credentials',function(err,data){
                resolve(data.followers_count);
            });
        });
        return promise;
    } catch (err) {
        console.log("Error ==> ", err);
        return 0;
    }
}

social_helper.get_pinterest_friends_by_token = async (access_token) => {
    try {
        return 0;
    } catch (err) {
        return 0;
    }
}

social_helper.get_linkedin_friends_by_token = async (access_token) => {
    try {
        var linkedin = Linkedin.init(access_token);
        var promise = new Promise(function(resolve, reject) {
            linkedin.people.me(function(err, $in) {
                if(err){
                    resolve(0);
                } else {
                    resolve($in.numConnections);
                }
            });
        });
        return promise;
    } catch (err) {
        return 0;
    }
}

module.exports = social_helper;