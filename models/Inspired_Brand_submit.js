//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var InspiredBrandModelSchema = new Schema({
    brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'promoter', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    image: String,
    social_media_platform: String,
    text: String,
    price: Number,
    status: Boolean,
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile modyel from schema
var Inspired_brands = mongoose.model('inspired_brands', InspiredBrandModelSchema, 'inspired_brands');

module.exports = Inspired_brands;