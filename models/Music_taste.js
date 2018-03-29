//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var MusicTasteSchema = new Schema({
    name: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var Music_taste = mongoose.model('music_taste', MusicTasteSchema, 'music_taste');

module.exports = Music_taste;