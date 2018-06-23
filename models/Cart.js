//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var CartSchema = new Schema({
    promoter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'promoter', required: true },
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'campaign' },
    inspired_post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'inspired_brands' },
    applied_post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'campaign_applied' },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

CartSchema.index( { "promoter_id": 1, "applied_post_id": 1 }, { unique: true, partialFilterExpression: {applied_post_id: {$exists:true}} } )
CartSchema.index( { "promoter_id": 1, "inspired_post_id": 1 }, { unique: true, partialFilterExpression: {inspired_post_id: {$type: mongoose.Schema.Types.ObjectId}} } )

// Compile model from schema
var cart = mongoose.model('cart', CartSchema, 'cart');

module.exports = cart;