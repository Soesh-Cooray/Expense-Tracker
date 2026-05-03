const express = require('express');
const router = express.Router();
const Expense = require('../models/expenses');
const authMiddleware = require('../middleware/auth');
const User = require('../models/users');

router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { category, title, amount, description, date, paymentMethod } = req.body;
        const userId = req.user.id;
        const expense = new Expense({ userId, category, title, amount, description, date, paymentMethod });
        await expense.save();
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const expenses = await Expense.find({ userId });
        res.status(200).json(expenses);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { category, title, amount, description, date, paymentMethod } = req.body;
        const userId = req.user.id;
        const expense = await Expense.findOneAndUpdate(
            { _id: id, userId },
            { category, title, amount, description, date, paymentMethod },
            { returnDocument: 'after' }
        );
        res.status(200).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const expense = await Expense.findOneAndDelete({ _id: id, userId });
        res.status(200).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;

