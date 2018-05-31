//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var GroupModelSchema = new Schema({
    name: { type: String, required: true},
    image: String,
    promoter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'promoters', required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// GroupModelSchema.index( { name : 1 } , { caseInsensitive : true } );

// Compile modyel from schema
var Group = mongoose.model('groups', GroupModelSchema, 'groups');

module.exports = Group;