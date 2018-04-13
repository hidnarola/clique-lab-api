//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var EducationSchema = new Schema({
    name: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile modyel from schema
var Education = mongoose.model('educations', EducationSchema, 'educations');

module.exports = Education;