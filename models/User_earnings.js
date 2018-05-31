var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UserEarningSchema = new Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'campaign', required: true },
    price: { type: Number },
    created_at: { type: Date, default: Date.now },
}, { versionKey: false });

var Earnings = mongoose.model('user_earnings', UserEarningSchema, 'user_earnings');

module.exports = Earnings;