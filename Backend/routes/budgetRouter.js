const express = require('express');
const router = express.Router();
const Budget = require('../models/budget');
const Expense = require('../models/expenses');
const authMiddleware = require('../middleware/auth');

const addPeriod = (dateValue, period) => {
    const nextDate = new Date(dateValue);

    if (period === 'Weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
    } else if (period === 'Yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
    }

    return nextDate;
};

const rollBudgetToCurrentPeriod = async (budget, nowDate) => {
    let periodStart = new Date(budget.startDate);
    let periodEnd = addPeriod(periodStart, budget.period);
    let changed = false;

    while (periodEnd <= nowDate) {
        periodStart = periodEnd;
        periodEnd = addPeriod(periodStart, budget.period);
        changed = true;
    }

    if (changed) {
        budget.startDate = periodStart;
        await budget.save();
    }

    return {
        periodStart,
        periodEnd,
    };
};

router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { amount, category, period, startDate } = req.body;
        const userId = req.user.id;
        const budget = new Budget({ userId, amount, category, period, startDate });
        await budget.save();
        res.status(201).json(budget);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const budgets = await Budget.find({ userId }).sort({ createdAt: -1 });
        const nowDate = new Date();

        const budgetsWithStats = await Promise.all(
            budgets.map(async (budget) => {
                const { periodStart, periodEnd } = await rollBudgetToCurrentPeriod(budget, nowDate);

                const spending = await Expense.aggregate([
                    {
                        $match: {
                            userId: budget.userId,
                            category: budget.category,
                            date: {
                                $gte: periodStart,
                                $lt: periodEnd,
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            spentAmount: { $sum: '$amount' },
                        },
                    },
                ]);

                const spentAmount = Number(spending[0]?.spentAmount || 0);
                const budgetAmount = Number(budget.amount || 0);
                const progress = budgetAmount > 0 ? Math.min(spentAmount / budgetAmount, 1) : 0;

                return {
                    ...budget.toObject(),
                    periodStart,
                    periodEnd,
                    spentAmount,
                    remainingAmount: Math.max(budgetAmount - spentAmount, 0),
                    progress,
                };
            })
        );

        res.status(200).json(budgetsWithStats);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, category, period, startDate } = req.body;
        const userId = req.user.id;

        const budget = await Budget.findOneAndUpdate(
            { _id: id, userId },
            { amount, category, period, startDate },
            { returnDocument: 'after' }
        );

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        res.status(200).json(budget);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const budget = await Budget.findOneAndDelete({ _id: id, userId });
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
