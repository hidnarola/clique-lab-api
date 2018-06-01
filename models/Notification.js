var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationSchema = new Schema({

}, { versionKey: false });

var Notification = mongoose.model('notifications', NotificationSchema, 'notifications');

module.exports = Notification;