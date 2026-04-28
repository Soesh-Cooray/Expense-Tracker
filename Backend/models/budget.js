const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, enum: ['Food', 'Transport', 'Utilities','Rent','Entertainment','Health','Other'], trim: true },
    period: { type: String, enum: ['Weekly', 'Monthly', 'Yearly'], required: true },
    startDate: { type: Date, required: true },
},{ timestamps: true
});

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;