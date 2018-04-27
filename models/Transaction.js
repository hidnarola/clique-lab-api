var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var TransactionSchema = new Schema({
    promoter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'promoters', required: true },
    name: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
}, { versionKey: false });

var Transaction = mongoose.model('transactions', TransactionSchema, 'transactions');

module.exports = Transaction;