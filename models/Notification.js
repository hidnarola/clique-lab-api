var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationSchema = new Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    text: { type: String, required: true },
    image_url: { type: String, required: true },
    is_read: {type: Boolean, default:false},
    type:{type:String},
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

var Notification = mongoose.model('notifications', NotificationSchema, 'notifications');

module.exports = Notification;