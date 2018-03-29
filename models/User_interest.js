//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var InterestModelSchema = new Schema({
    name: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var User_interest = mongoose.model('user_interest', InterestModelSchema, 'user_interest');

module.exports = User_interest;