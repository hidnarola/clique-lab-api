//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var Campaign_inviteSchema = new Schema({
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'campaign', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

var Campaign_invite = mongoose.model('campaign_invite', Campaign_inviteSchema, 'campaign_invite');

module.exports = Campaign_invite;