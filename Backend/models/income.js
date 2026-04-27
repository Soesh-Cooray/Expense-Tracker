const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Salary', 'Freelance', 'Investment', 'Other'], trim: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    date:{type:Date, required:true},
},{ timestamps: true
});

const Income = mongoose.model('Income', incomeSchema);

module.exports = Income;