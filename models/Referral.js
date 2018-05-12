//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var ReferralSchema = new Schema({
    promoter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'promoters', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    reward_amount: Number,
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var Referrals = mongoose.model('referrals', ReferralSchema, 'referrals');

module.exports = Referrals;