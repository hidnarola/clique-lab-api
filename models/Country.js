//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var Country_Schema = new Schema({
    name :String,
    short_name :String,
    country_code :String,
    status : Boolean,
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });


var Country = mongoose.model('country', Country_Schema, 'country');

module.exports = Country;