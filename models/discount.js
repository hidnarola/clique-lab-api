//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var DicountModelSchema = new Schema({
    code: { type: String, required: true },
    price: Number,
    percentage: Number,
    terms: String,
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var Discount = mongoose.model('discount', DicountModelSchema, 'discount');

module.exports = Discount;