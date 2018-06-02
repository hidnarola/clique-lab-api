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
    try {
        var campaign_helper = require('./../helpers/campaign_helper');
        let campaign_resp = await campaign_helper.get_all_campaign();
        if (campaign_resp.status === 1) {
            let dir = './uploads/campaign/';
            campaign_resp.campaigns.forEach(async (campaign) => {
                if (campaign.cover_image) {
                    if (fs.existsSync(dir + campaign.cover_image)) {
                        console.log("campaign cover image available = ", campaign._id);
                        var thumbnail1 = await sharp(dir + campaign.cover_image)
                            .resize(512, 384)
                            .toFile(dir + '512X384/' + campaign.cover_image);
                    }
                }
                if (campaign.mood_board_images && campaign.mood_board_images.length > 0) {
                    campaign.mood_board_images.forEach(async (board_image) => {
                        if (fs.existsSync(dir + board_image)) {
                            console.log("campaign board image available = ", campaign._id);
                            var thumbnail1 = await sharp(dir + board_image)
                                .resize(180, 110)
                                .toFile(dir + '180X110/' + board_image);
                        }
                    });
                }
            });
        }
    } catch (err) {
        console.log("Campaign : error in sharp ===> ", err);
    }
};

let promote_image_upload = async() => {
    try{
        var promoter_helper = require("./../helpers/promoter_helper");
        let promoter_resp = await promoter_helper.get_all_promoter();
        if (promoter_resp.status === 1) {
            let dir = './uploads/promoter/';
            promoter_resp.promoters.forEach(async (promoter) => {
                if (promoter.avatar) {
                    if (fs.existsSync(dir + promoter.avatar)) {
                        console.log("promoter image available = ", promoter._id);
                        var thumbnail1 = await sharp(dir + promoter.avatar)
                            .resize(80, 80)
                            .toFile(dir + '80X80/' + promoter.avatar);
                    }
                }
            });
        }
    } catch (err) {
        console.log("Promoter : error in sharp ===> ", err);
    }
};

let applied_campaign_image_resize = async() => {
    try{
        var campaign_helper = require("./../helpers/campaign_helper");
        let campaign_resp = await campaign_helper.get_all_applied_campaign();
        if (campaign_resp.status === 1) {
            let dir = './uploads/campaign_applied/';
            campaign_resp.applied_campaign.forEach(async (campaign) => {
                if (campaign.image) {
                    if (fs.existsSync(dir + campaign.image)) {
                        console.log("campaign applied image available = ", campaign._id);
                        var thumbnail1 = await sharp(dir + campaign.image)
                            .resize(512, 384)
                            .toFile(dir + '512X384/' + campaign.image);

                        var thumbnail1 = await sharp(dir + campaign.image)
                            .resize(800, 600)
                            .toFile(dir + '800X600/' + campaign.image);
                    }
                }
            });
        }
    } catch (err) {
        console.log("Promoter : error in sharp ===> ", err);
    }
};

campaign_update();
promote_image_upload();
applied_campaign_image_resize();