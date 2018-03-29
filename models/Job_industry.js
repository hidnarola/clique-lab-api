//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var JobIndustrySchema = new Schema({
    name: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var Job_industry = mongoose.model('job_industry', JobIndustrySchema, 'job_industry');

module.exports = Job_industry;