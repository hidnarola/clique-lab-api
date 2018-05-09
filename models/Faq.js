//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var Faq_Schema = new Schema({
    question :String,
    answer :String,
    status : Boolean,
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

var FAQ = mongoose.model('faq', Faq_Schema, 'faq');

module.exports = FAQ;