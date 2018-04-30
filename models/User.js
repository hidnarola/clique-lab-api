//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var FacebookSchema = new Schema({
    id : String,
    username: String,
    access_token : String,
    expiry_time:Date,
    refresh_token:String,
    profile_url : String,
    no_of_friends: Number
});

var InstagramSchema = new Schema({
    id : String,
    username: String,
    access_token : String,
    expiry_time:Date,
    refresh_token:String,
    profile_url : String,
    no_of_followers: Number
    
});

var TwitterSchema = new Schema({
    id : String,
    username: String,
    access_token : String,
    expiry_time:Date,
    refresh_token:String,
    profile_url : String,
    no_of_followers: Number
    
});

var PinterestSchema = new Schema({
    id : String,
    username: String,
    access_token : String,
    expiry_time:Date,
    refresh_token:String,
    profile_url : String,
    no_of_followers: Number
    
});

var LinkedInSchema = new Schema({
    id : String,
    username: String,
    access_token : String,
    expiry_time:Date,
    refresh_token:String,
    profile_url : String,
    no_of_connections: Number
    
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
    name: { type: String, required: true }, // 1
    short_bio: String, // 2
     username: { type: String },
    email: { type: String, required: true, unique: true }, // 3
    image: String, // 4
    user_interest: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user_interest' }], // 5
    job_industry: { type: mongoose.Schema.Types.ObjectId, ref: 'job_industry' }, // 6
    music_taste: { type: mongoose.Schema.Types.ObjectId, ref: 'music_taste' }, // 7
    age: Number, // 8
    gender: { type: String, enum: ["male", "female"] }, // 9
    date_of_birth: Date, // 10
    location: String, // 11
    state: String,
    suburb: String, // 12
    facebook: FacebookSchema, // 13
    instagram: InstagramSchema, // 14
    twitter: TwitterSchema, // 15
    pinterest: PinterestSchema, // 16
    linkedin: LinkedInSchema, // 17
    notification_settings: NotificationSettings,
    job_title: { type: mongoose.Schema.Types.ObjectId, ref: 'job_title' }, // 18
    experience: Number, // In year // 19
    education: { type: mongoose.Schema.Types.ObjectId, ref: 'educations' }, // 20
    language:  { type: mongoose.Schema.Types.ObjectId, ref: 'languages' }, // 21
    ethnicity: { type: mongoose.Schema.Types.ObjectId, ref: 'ethnicity' },// 22
    interested_in: { type: String, enum: ["male", "female", "both"] },
    country : { type: mongoose.Schema.Types.ObjectId, ref: 'country' },
    relationship_status: { type: String, enum: ["Married", "Unmarried", "Single"] }, // 24
    wallet_balance: { type: Number, default: 0 },
    bank: [BankSchema], // 25
    sexual_orientation :String,
    status :{ type:Boolean, default:true},
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var User = mongoose.model('users', UserModelSchema, 'users');

module.exports = User;