//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var EthnicitySchema = new Schema({
    name: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile modyel from schema
var Ethnicity = mongoose.model('ethnicity', EthnicitySchema, 'ethnicity');

module.exports = Ethnicity;