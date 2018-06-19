var apn = require('apn');
var gcm = require('node-gcm');

var config = require('./../config');

var push_notification_helper = {};

var options = {
    token: {
        key: config.APN_KEY_FILE,
        keyId: config.APN_KEY_ID,
        teamId: config.APN_TEAM_ID
    },
    production: true
};

var apnProvider = new apn.Provider(options);

var sender = new gcm.Sender(config.ANDROID_SERVER_KEY);

push_notification_helper.sendToIOS = async (device_token, data) => {
    try {
        var note = new apn.Notification();

        note.expiry = Math.floor(Date.now() / 1000) + 2419200; // Expires 4 week from now.
        // note.badge = 3;
        note.sound = "ping.aiff";
        note.alert = "\uD83D\uDCE7 \u2709 " + data.message;
        note.payload = data;
        note.topic = config.APN_BUNDLE_ID;

        let result = await apnProvider.send(note, device_token);
        return { "status": 1, "message": "Notification has been sent", "result": result };
    } catch (err) {
        return { "status": 0, "message": "Error occured while sending push notification to IOS device", error: err }
    }
}

push_notification_helper.sendToAndroid = async (device_token, data) => {
    try {
        var message = new gcm.Message({
            notification : {
                title : data.message
            }
        });

        // Try to resend 5 times, if fails
        let result = sender.send(message, { registrationTokens: [device_token] }, function(err,response){
            if (err) {
                console.error("error : ",err);
            } else {
                console.log("success : ",response);
            }
        });

        return { "status": 1, "message": "Notification has been sent", "result": result };
    } catch (err) {
        return { "status": 0, "message": "Error occured while sending push notification to android device", error: err }
    }
}

module.exports = push_notification_helper;