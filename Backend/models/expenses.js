const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    date:{type:Date, required:true},
    paymentMethod:{type:String, required:true}
},{ timestamps: true 

});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;