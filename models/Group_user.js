//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var Group_userSchema = new Schema({
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'groups', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var Group_user = mongoose.model('group_user', Group_userSchema, 'group_user');

module.exports = Group_user;