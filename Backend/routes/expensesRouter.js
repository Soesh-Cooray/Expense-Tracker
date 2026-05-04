const express = require('express');
const router = express.Router();
const Expense = require('../models/expenses');
const authMiddleware = require('../middleware/auth');
const User = require('../models/users');

router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { category, title, amount, description, date, paymentMethod } = req.body;
        const userId = req.user.id;

        if (!title || String(title).trim() === '') {
            return res.status(400).json({ message: 'Title is required' });
        }

        if (amount === undefined || amount === null || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        if (!date || Number.isNaN(new Date(date).getTime())) {
            return res.status(400).json({ message: 'A valid date is required' });
        }

        if (!paymentMethod || String(paymentMethod).trim() === '') {
            return res.status(400).json({ message: 'Payment method is required' });
        }

        if (category && !['Food', 'Transport', 'Utilities', 'Rent', 'Entertainment', 'Health', 'Other'].includes(category)) {
            return res.status(400).json({ message: 'Invalid expense category' });
        }

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

        if (title !== undefined && String(title).trim() === '') {
            return res.status(400).json({ message: 'Title cannot be empty' });
        }

        if (amount !== undefined && Number(amount) <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        if (date !== undefined && Number.isNaN(new Date(date).getTime())) {
            return res.status(400).json({ message: 'A valid date is required' });
        }

        if (paymentMethod !== undefined && String(paymentMethod).trim() === '') {
            return res.status(400).json({ message: 'Payment method cannot be empty' });
        }

        if (category !== undefined && !['Food', 'Transport', 'Utilities', 'Rent', 'Entertainment', 'Health', 'Other'].includes(category)) {
            return res.status(400).json({ message: 'Invalid expense category' });
        }

        const updateData = {};
        if (category !== undefined) updateData.category = category;
        if (title !== undefined) updateData.title = title;
        if (amount !== undefined) updateData.amount = amount;
        if (description !== undefined) updateData.description = description;
        if (date !== undefined) updateData.date = date;
        if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;

        const expense = await Expense.findOneAndUpdate(
            { _id: id, userId },
            updateData,
            { returnDocument: 'after', runValidators: true }
        );

        if (!expense) return res.status(404).json({ message: 'Expense not found' });

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

