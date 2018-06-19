var apn = require('apn');

var push_notification_helper = {};

var options = {
    token: {
      key: "AuthKey_6SHSSY92PW.p8",
      keyId: "6SHSSY92PW",
      teamId: "68D6E2QK47"
    },
    production: false
  };
  
  var apnProvider = new apn.Provider(options);

  push_notification_helper.sendToIOS = async (device_token,data) => {
    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 2419200; // Expires 4 week from now.
    // note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = "\uD83D\uDCE7 \u2709 "+data.message;
    note.payload = data;
    note.topic = "";

    let result = await apnProvider.send(note, deviceToken);
    return result;
  }

  push_notification_helper.sendToAndroid = async(device_token,data) => {

  }

module.exports = push_notification_helper;