const mongoose = require('mongoose');

const savingsTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    savingsGoalId: { type: mongoose.Schema.Types.ObjectId, ref: 'SavingsGoal', required: true },
    transactionDate: { type: Date, default: Date.now },
    timestamp: { type: Date, default: Date.now }
});

const SavingsTransaction = mongoose.model('SavingsTransaction', savingsTransactionSchema);

module.exports = SavingsTransaction;