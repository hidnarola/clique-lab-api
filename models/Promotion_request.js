//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var Promotion_requestSchema = new Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    promoter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'promoters', required: true },
    social_media_platform: { type: String, enum: ["facebook", "instagram", "twitter", "pinterest", "linkedin"], required: true },
    post_text: String,
    price: Number,
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var Promotion_request = mongoose.model('promotion_request', Promotion_requestSchema, 'promotion_request');

module.exports = Promotion_request;