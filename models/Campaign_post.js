//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var Campaign_postSchema = new Schema({
    post_id :String,
    social_media_platform: { type: String, enum: ["facebook", "instagram", "twitter", "pinterest", "linkedin"] },
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'campaign' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Campaign_userSchema.ensureIndex( { "firstname": 1, "lastname": 1 }, { unique: true } )


// Compile model from schema
var Campaign_post = mongoose.model('campaign_post', Campaign_postSchema, 'campaign_post');

module.exports = Campaign_post;