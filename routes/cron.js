var config = require('../config');

var fs = require("fs");
var sharp = require('sharp');

var user_helper = require('./../helpers/user_helper');

var cron = require('node-cron');

cron.schedule('0 * * * *', async () => {
    let users = await user_helper.get_all_user();
    if (users.status === 1) {
        users.users.forEach(async (user) => {
            let resp = await user_helper.update_social_connection(user._id);
        });
    }
});

let campaign_update = async () => {
    console.log("this is called ------------------------------------------");
    var campaign_helper = require('./../helpers/campaign_helper');
    let campaign_resp = await campaign_helper.get_all_campaign();
    if (campaign_resp.status === 1) {
        let dir = './uploads/campaign/';
        campaign_resp.campaigns.forEach(async (campaign) => {
            if (campaign.cover_image) {
                if (fs.existsSync(dir + campaign.cover_image)) {
                    console.log("image available");
                    var thumbnail1 = await sharp(dir + campaign.cover_image)
                        .resize(512, 384)
                        .toFile(dir + '512X384/' + campaign.cover_image);
                }
            }
        });
    }
};

campaign_update();