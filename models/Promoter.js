//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var CreditcardSchema = new Schema({
    name: { type: String, required: true },
    number: { type: String, required: true },
    expiry_date: { type: Date, required: true },
    cvv: { type: Number, required: true }
});

var BankSchema = new Schema({
    bank_name: { type: String, required: true },
    holder_name: { type: String, required: true },
    account_number: { type: Number, required: true },
    bsb: { type: Number, required: true }
});

var PromoterModelSchema = new Schema({
    full_name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    company: { type: String, required: true },
    password: { type: String, required: true },
    avatar: String,
    industry_category: { type: mongoose.Schema.Types.ObjectId, ref: 'job_industry', required: true },
    industry_description: String,
    referal_link: String,
    wallet_balance: Number,
    date_of_birth: Date,
    status: {type:Boolean, default:true},
    refresh_token: {type: String},
    last_login_date: {type: Date},
    password_changed_date: {type: Date},
    creditcard: CreditcardSchema,
    bank_details: BankSchema,
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

// Compile model from schema
var Promoter = mongoose.model('promoters', PromoterModelSchema, 'promoters');

module.exports = Promoter;