var config = require('../config');
var user_helper = require('./../helpers/user_helper');

var cron = require('node-cron');

cron.schedule('0 * * * *', async () => {
    let users = await user_helper.get_all_user();
    if(users.status === 1){
        users.users.forEach(async (user) => {
            let resp = await user_helper.update_social_connection(user._id);
        });
    }
});