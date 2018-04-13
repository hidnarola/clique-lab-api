//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var LanguageSchema = new Schema({
    name: { type: String, required: true },
    short_name: {type: String, required: true},
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile modyel from schema
var Language = mongoose.model('languages', LanguageSchema, 'languages');

module.exports = Language;