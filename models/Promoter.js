//Require Mongoose
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

//Define a schema
var Schema = mongoose.Schema;

var PromoterSchema = new Schema({
    full_name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    company: { type: String, required: true },
    password: { type: String, required: true },
    avatar: String,
    industry_category: { type: mongoose.Schema.Types.ObjectId, ref: 'job_industry' },
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'country' },
    industry_description: String,
    referal_link: String,
    wallet_balance: Number,
    date_of_birth: Date,
    status: {type:Boolean, default:false},
    email_verified: {type:Boolean, default:false},
    refresh_token: {type: String},
    last_login_date: {type: Date},
    industry_fill : {type: Boolean, default: false},
    password_changed_date: {type: Date},

    stripe_customer_id: String,
    stripe_connect_id: String,

    bank_details: [String], // Bank account id of stripe
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

PromoterSchema.pre('save', function(next) {
    var user = this;
    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();
    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);
        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);
            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

// Compile model from schema
var Promoter = mongoose.model('promoters', PromoterSchema, 'promoters');

module.exports = Promoter;