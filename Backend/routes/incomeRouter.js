const express = require('express');
const router = express.Router();
const Income = require('../models/income');
const authMiddleware = require('../middleware/auth');
const User = require('../models/users');

router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { category, title, amount, description, date } = req.body;
        const userId = req.user.id;
        const income = new Income({ userId, category, title, amount, description, date });
        await income.save();
        res.status(201).json(income);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }   
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const incomes = await Income.find({ userId });
        res.status(200).json(incomes);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { category, title, amount, description, date } = req.body;
        const userId = req.user.id;
        const income = await Income.findOneAndUpdate(
            { _id: id, userId },
            { category, title, amount, description, date },
            { returnDocument: 'after' }
        );
        if (!income) {
            return res.status(404).json({ message: 'Income not found' });
        }
        res.status(200).json(income);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const income = await Income.findOneAndDelete({ _id: id, userId });
        if (!income) {
            return res.status(404).json({ message: 'Income not found' });
        }
        res.status(200).json({ message: 'Income deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;