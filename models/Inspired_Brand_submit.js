//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var InspiredBrandModelSchema = new Schema({
    company: String,
    image: String,
   text:String,
   price:Number
}, { versionKey: false });

// Compile modyel from schema
var Inspired_brands = mongoose.model('inspired_brands', InspiredBrandModelSchema, 'inspired_brands');

module.exports = Inspired_brands;