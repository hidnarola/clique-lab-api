//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var FacebookSchema = new Schema({
    no_of_friends: Number,
    username: String
});

var InstagramSchema = new Schema({
    no_of_followers: Number,
    username: String
});

var TwitterSchema = new Schema({
    no_of_followers: Number,
    username: String
});

var PinterestSchema = new Schema({
    no_of_followers: Number,
    username: String
});

var LinkedInSchema = new Schema({
    no_of_coonections: Number,
    username: String
});

var BankSchema = new Schema({
    bank_name: { type: String, required: true },
    account_name: { type: String, required: true },
    account_number: { type: Number, required: true },
    bsb: { type: Number, required: true },
});

var NotificationSettings = new Schema({
    got_approved: { type: Boolean, default: true },
    got_paid: { type: Boolean, default: true },
    friend_just_got_paid: { type: Boolean, default: false },
    got_new_offer: { type: Boolean, default: true },
    push_got_approved: { type: Boolean, default: true },
    push_got_paid: { type: Boolean, default: true },
    push_friend_just_got_paid: { type: Boolean, default: false },
    push_got_new_offer: { type: Boolean, default: true },
});

var UserModelSchema = new Schema({
    name: { type: String, required: true },
    short_bio: String,
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    avatar: String,
    user_interest: { type: mongoose.Schema.Types.ObjectId, ref: 'user_interest', required: true },
    job_industry: { type: mongoose.Schema.Types.ObjectId, ref: 'job_industry', required: true },
    music_taste: { type: mongoose.Schema.Types.ObjectId, ref: 'music_taste', required: true },
    age: Number,
    gender: { type: String, enum: ["male", "female"] },
    date_of_birth: Date,
    location: String,
    state: String,
    suburb: String,
    facebook: FacebookSchema,
    instagram: InstagramSchema,
    twitter: TwitterSchema,
    pinterest: PinterestSchema,
    linkedin: LinkedInSchema,
    notification_settings: NotificationSettings,
    job_title: String,
    experience: Number, // In year
    education: String,
    languages: { type: String },
    ethnicity: { type: String },
    interested_in: { type: String, enum: ["male", "female", "both"] },
    relationship_status: { type: String, enum: ["Married", "Unmarried", "Single"] },
    wallet_balance: { type: Number, default: 0 },
    bank: BankSchema,
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var User = mongoose.model('users', UserModelSchema, 'users');

module.exports = User;