const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetAmount: { type: Number, required: true, min: 0 },
    savedAmount: { type: Number, default: 0, min: 0 },
    goalName: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    timestamp: { type: Date, default: Date.now }
});

const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);

module.exports = SavingsGoal;