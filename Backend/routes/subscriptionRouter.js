const express = require('express');
const router = express.Router();    
const Subscription = require('../models/subscription');
const User = require('../models/users');
const authMiddleware = require('../middleware/auth'); 

router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { name, amount, startDate, billingCycle, category } = req.body;
        const userId = req.user.id;
        const subscription = new Subscription({ userId, name, amount, startDate, billingCycle, category });
        await subscription.save();
        res.status(201).json(subscription);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const subscriptions = await Subscription.find({ userId });
        res.status(200).json(subscriptions);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, amount, startDate, billingCycle, category } = req.body;
        const userId = req.user.id;
        const subscription = await Subscription.findOneAndUpdate(
            { _id: id, userId },
            { name, amount, startDate, billingCycle, category },
            { returnDocument: 'after' }
        );
        res.status(200).json(subscription);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const subscription = await Subscription.findOneAndDelete({ _id: id, userId });
        res.status(200).json(subscription);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;




