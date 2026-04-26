const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    category: { type: String, trim: true },
    billingCycle: { type: String, enum: ['weekly', 'monthly', 'yearly'], required: true }
},{
    timestamps: true
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;