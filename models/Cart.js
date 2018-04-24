//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var CartSchema = new Schema({
    promoter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'promoter', required: true },
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'campaign' },
    inspired_post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'inspired_brands' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Campaign_userSchema.ensureIndex( { "firstname": 1, "lastname": 1 }, { unique: true } )

// Compile model from schema
var cart = mongoose.model('cart', CartSchema, 'cart');

module.exports = cart;