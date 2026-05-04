const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const SavingsGoal = require('../models/savingsGoal'); 
const authMiddleware = require('../middleware/auth'); 
const SavingsTransaction = require('../models/savingsTransactions');

const recalculateSavedAmount = async (savingsGoalId, userId) => {
    const [result] = await SavingsTransaction.aggregate([
        {
            $match: {
                savingsGoalId: new mongoose.Types.ObjectId(savingsGoalId),
                userId: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: '$savingsGoalId',
                total: { $sum: '$amount' }
            }
        }
    ]);

    const totalSaved = result ? result.total : 0;
    await SavingsGoal.findOneAndUpdate(
        { _id: savingsGoalId, userId },
        { savedAmount: totalSaved }
    );
};

// savings goal routes
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { targetAmount, goalName, dueDate } = req.body;

        if (!goalName || String(goalName).trim() === '') {
            return res.status(400).json({ message: 'Goal name is required' });
        }

        if (!targetAmount || targetAmount <= 0) {
            return res.status(400).json({ message: 'Target amount must be a positive number' });
        }

        if (!dueDate) {
            return res.status(400).json({ message: 'Due date is required' });
        }

        const savingsGoal = new SavingsGoal({ userId: req.user.id, targetAmount, goalName, dueDate });
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
        const { targetAmount, goalName, dueDate } = req.body;
        const savingsGoal = await SavingsGoal.findOneAndUpdate({ _id: id, userId: req.user.id }, { targetAmount, goalName, dueDate }, { returnDocument: 'after' });
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

//savings transactions routes

router.get('/transactions/all', authMiddleware, async (req, res) => {
    try {
        const transactions = await SavingsTransaction.find({ userId: req.user.id }).populate('savingsGoalId', 'goalName')
            .sort({ transactionDate: -1 }); // Optional: Sort by newest first

        res.json({ 
            count: transactions.length,
            transactions 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/transactions/add', authMiddleware, async (req, res) => {
    try {
        const { amount, savingsGoalId, transactionDate } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        if (!savingsGoalId) {
            return res.status(400).json({ message: 'Savings goal ID is required' });
        }

        const transaction = new SavingsTransaction({ userId: req.user.id, amount, savingsGoalId, transactionDate });
        await transaction.save();
        await recalculateSavedAmount(savingsGoalId, req.user.id);

        res.status(201).json({ message: 'Transaction added successfully', transaction });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/transactions/update/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, transactionDate } = req.body;

        const updateData = {};
        if (amount !== undefined) updateData.amount = amount;
        if (transactionDate !== undefined) updateData.transactionDate = transactionDate;

        const transaction = await SavingsTransaction.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            updateData,
            { returnDocument: 'after', runValidators: true }
        );

        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        await recalculateSavedAmount(transaction.savingsGoalId, req.user.id);

        res.json({ message: 'Transaction updated successfully', transaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.delete('/transactions/delete/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await SavingsTransaction.findOneAndDelete({ _id: id, userId: req.user.id });
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        await recalculateSavedAmount(transaction.savingsGoalId, req.user.id);

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;