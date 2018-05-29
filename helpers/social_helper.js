var FB = require('fb');
var Twitter = require('twitter');

var config = require("./../config");
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

        // var client = new Twitter({
        //     consumer_key: 'HMZWrgFh4A9hhoWhZdkPS1IyO',
        //     consumer_secret: '10kLAI5ybuC1AxY7WmdHDba2r9uCN4k6LYbvGhSNHr9Igq7uZy',
        //     access_token_key: '981822054855933952-pyB8kqCK5pDIZl7tBWcaavfvNWY7JnM',
        //     access_token_secret: 'frUH9G8PVgQIQ3AYdRF223SDAFDOpEFFOEv8TZBfhT7Ba'
        // });
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
        return 0;
    } catch (err) {
        return 0;
    }
}

module.exports = social_helper;