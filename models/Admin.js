//Require Mongoose
var mongoose = require('mongoose');
// var bcrypt = require('bcrypt');
// var SALT_WORK_FACTOR = 10;

//Define a schema
var Schema = mongoose.Schema;

var AdminSchema = new Schema({
    full_name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    status: {type:Boolean, default:false},
    refresh_token: {type: String},
    last_login_date: {type: Date},
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });


// Compile model from schema
var Admin = mongoose.model('admin', AdminSchema, 'admin');

module.exports = Admin;