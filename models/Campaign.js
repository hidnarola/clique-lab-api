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
    social_media_platform: { type: String, enum: ["facebook", "instagram", "twitter", "pinterest", "linkedin"] },
    hash_tag: [String],
    at_tag: [String],
    privacy: { type: String, enum: ["public", "invite"], default: "public" },
    media_format: {type: String},
    location: String,
    price: Number,
    currency: String,
    cover_image: String,
    mood_board_images: [{type: String}],
    status : { type:Boolean, default:true},
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var Campaign = mongoose.model('campaign', CampaignModelSchema, 'campaign');

module.exports = Campaign;