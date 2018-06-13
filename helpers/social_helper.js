var FB = require('fb');
var Twitter = require('twitter');
var PDK = require('node-pinterest');

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
        var pinterest = PDK.init(access_token);
        var options = {
            "qs":{
                "fields":"counts"
            }
        }

        var promise = new Promise(function(resolve,reject){
            pinterest.api('me/followers',options).then((data) => {
                if(data && data.data[0] && data.data[0]["counts"] && data.data[0]["counts"].followers){
                    resolve(data.data[0]["counts"].followers);
                } else {
                    resolve(0);
                }
            });
        });
        return promise;
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

social_helper.get_facebook_post_statistics = async(post_id,access_token) => {
    try {
        FB.setAccessToken(access_token);
        let response = await FB.api('/'+post_id,{"fields":["shares","likes.limit(0).summary(true)","comments.limit(0).summary(true)"]});
        console.log("response ==> ",response);

        var shares = (response.shares) ? response.shares.count : 0;
        return {"status":1,"likes":response.likes.summary.total_count, "comments":response.comments.summary.total_count, "shares":shares};
        // return {"status":1,"likes":response.summary.total_count};
    } catch (err) {
        return {"status":0,"likes":0};
    }
}

social_helper.get_pinterest_post_statistics = async(post_id,access_token) => {
    try {
        var pinterest = PDK.init(access_token);
        var options = {
            "qs":{
                "fields":"counts"
            }
        }

        var pinterest_resp = new Promise(function(resolve,reject){
            pinterest.api('pins/'+post_id,options).then((data) => {
                if(data && data.data[0] && data.data[0]["counts"]){
                    resolve(data.counts);
                } else {
                    resolve(0);
                }
            });
        });

        console.log("resp ==> ", pinterest_resp);
        return pinterest_resp;
    } catch (err) {
        return 0;
    }
}
module.exports = social_helper;