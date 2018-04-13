//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var JobTitleSchema = new Schema({
    job_title: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile modyel from schema
var JobTitle = mongoose.model('job_title', JobTitleSchema, 'job_title');

module.exports = JobTitle;