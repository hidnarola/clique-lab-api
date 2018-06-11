var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var TransactionSchema = new Schema({
    promoter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'promoters', required: true },
    name: { type: String, required: true },
    company: { type: String },
    email: { type: String, required: true },
    abn: { type: String, required: true },
    total_amount: { type: Number },
    cart_items: [{
        campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'campaign' },
        inspired_post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'inspired_brands' },
        applied_post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'campaign_applied' }
    }],
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'country', required: true },
    address_line1: { type: String, required: true },
    address_line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    post_code: { type: String, required: true },
    credit_card: { type: String, required: true },
    stripe_charge_id: { type: String },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    created_at: { type: Date, default: Date.now },
}, { versionKey: false });

var Transaction = mongoose.model('transactions', TransactionSchema, 'transactions');

module.exports = Transaction;