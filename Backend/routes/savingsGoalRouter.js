const express = require('express');
const router = express.Router();
const SavingsGoal = require('../models/savingsGoal'); 
const authMiddleware = require('../middleware/auth'); 

router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { targetAmount, goalName, savedAmount, dueDate } = req.body;
        const savingsGoal = new SavingsGoal({ userId: req.user.id,targetAmount, goalName, savedAmount, dueDate });
        await savingsGoal.save();
        res.status(201).json({ message: 'Goal created successfully', savingsGoal });
    } catch (error) {
        res.status(400).json({ error: error.message }); 
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const savingsGoals = await SavingsGoal.find({ userId: req.user.id });
        res.json({ savingsGoals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { targetAmount, goalName, savedAmount, dueDate } = req.body;
        const savingsGoal = await SavingsGoal.findOneAndUpdate({ _id: id, userId: req.user.id }, { targetAmount, goalName, savedAmount, dueDate }, { new: true });
        if (!savingsGoal) return res.status(404).json({ message: 'Savings goal not found' });
        res.json({ message: 'Savings goal updated successfully', savingsGoal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const savingsGoal = await SavingsGoal.findOneAndDelete({ _id: id, userId: req.user.id });
        if (!savingsGoal) return res.status(404).json({ message: 'Savings goal not found' });
        res.json({ message: 'Savings goal deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}); 

module.exports = router;