var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var SettingsSchema = new Schema({
    key: { type: String, required: true },
    value: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

var Settings = mongoose.model('settings', SettingsSchema, 'settings');

module.exports = Settings;