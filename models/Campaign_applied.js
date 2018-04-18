//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var Campaign_appliedSchema = new Schema({
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'compaign', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    desription: String,
    image: String,
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var Campaign_applied = mongoose.model('campaign_applied', Campaign_appliedSchema, 'campaign_applied');

module.exports = Campaign_applied;