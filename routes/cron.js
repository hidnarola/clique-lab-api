var config = require('../config');

var fs = require("fs");
var sharp = require('sharp');

var user_helper = require('./../helpers/user_helper');
var campaign_post_helper = require("./../helpers/campaign_post_helper");

var cron = require('node-cron');

cron.schedule('0 * * * *', async () => {
    let users = await user_helper.get_all_user();
    if (users.status === 1) {
        users.users.forEach(async (user) => {
            let resp = await user_helper.update_social_connection(user._id);
            console.log("Resp ==> ",resp);
        });
    }
});

cron.schedule('5 * * * *',async() => {
    // Get all post that are already posted on social media
    let posts = await campaign_post_helper.get_all_post();
    if(posts.status === 1){
        // Iterate each post one by one
        posts.posts.forEach(async(post)=> {
            await campaign_post_helper.find_post_statistics_by_post(post);
        });
    }
});