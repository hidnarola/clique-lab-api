//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var Campaign_userSchema = new Schema({
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'campaign', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Campaign_userSchema.ensureIndex( { "firstname": 1, "lastname": 1 }, { unique: true } )


// Compile model from schema
var Campaign_user = mongoose.model('campaign_user', Campaign_userSchema, 'campaign_user');

module.exports = Campaign_user;