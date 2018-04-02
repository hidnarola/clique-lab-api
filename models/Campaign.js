//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var CampaignModelSchema = new Schema({
    promoter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'promoters', required: true },

    name: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    call_to_action: String,
    discount_code: { type: mongoose.Schema.Types.ObjectId,ref:"campaign" },
    description: String,
    social_media_platform: [{ type: String, enum: ["facebook", "instagram", "twitter", "pinterest", "linkedin"] }],
    hash_tag: [String],
    at_tag: [String],
    privacy: { type: String, enum: ["public", "invite"], default: "public" },
    status :Boolean,
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var Compaign = mongoose.model('campaign', CampaignModelSchema, 'campaign');

module.exports = Compaign;