import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const FINANCE_METRICS_KEY = 'financeMetrics';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const initialState = {
  expense: {
    total: 0,
    count: 0,
    categories: 0,
  },
  income: {
    total: 0,
    count: 0,
    categories: 0,
  },
  budget: {
    totalBudgeted: 0,
    totalSpent: 0,
    totalProgress: 0,
    count: 0,
  },
  savings: {
    totalSaved: 0,
    totalTarget: 0,
    progressPercent: 0,
    goalsCount: 0,
  },
  subscription: {
    activeCount: 0,
    monthlyTotal: 0,
    annualTotal: 0,
  },
  isRefreshing: false,
  updatedAt: null,
};

const persistMetrics = async (snapshot) => {
  const payload = {
    expense: snapshot.expense,
    income: snapshot.income,
    budget: snapshot.budget,
    savings: snapshot.savings,
    subscription: snapshot.subscription,
    isRefreshing: snapshot.isRefreshing,
    updatedAt: snapshot.updatedAt,
  };

  await SecureStore.setItemAsync(FINANCE_METRICS_KEY, JSON.stringify(payload));
};

const calculateCategoriesCount = (items, keyName = 'category') => {
  return new Set(items.map((item) => (item?.[keyName] || '').trim()).filter(Boolean)).size;
};

const useFinanceStore = create((set, get) => ({
  ...initialState,

  restoreFinanceMetrics: async () => {
    const savedMetrics = await SecureStore.getItemAsync(FINANCE_METRICS_KEY);
    if (!savedMetrics) return;

    try {
      const parsed = JSON.parse(savedMetrics);
      set(() => ({
        ...initialState,
        ...parsed,
      }));
    } catch {
      set(() => ({ ...initialState }));
    }
  },

  refreshFinanceMetrics: async (token) => {
    if (!API_BASE_URL || !token) {
      return;
    }

    const headers = { 'x-auth-token': token };

    set(() => ({ isRefreshing: true }));

    try {
      const [expenseRes, incomeRes, budgetRes, savingsGoalRes, subscriptionRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/expenses`, { headers }),
        axios.get(`${API_BASE_URL}/income`, { headers }),
        axios.get(`${API_BASE_URL}/budgets`, { headers }),
        axios.get(`${API_BASE_URL}/savings-goals`, { headers }),
        axios.get(`${API_BASE_URL}/subscriptions`, { headers }),
      ]);

      const expenses = Array.isArray(expenseRes.data) ? expenseRes.data : [];
      const incomes = Array.isArray(incomeRes.data) ? incomeRes.data : [];
      const budgets = Array.isArray(budgetRes.data) ? budgetRes.data : [];
      const savingsGoals = Array.isArray(savingsGoalRes.data?.savingsGoals) ? savingsGoalRes.data.savingsGoals : [];
      const subscriptions = Array.isArray(subscriptionRes.data) ? subscriptionRes.data : [];

      const expenseTotal = expenses.reduce((acc, expense) => acc + Number(expense?.amount || 0), 0);
      const incomeTotal = incomes.reduce((acc, income) => acc + Number(income?.amount || 0), 0);
      const budgetTotalBudgeted = budgets.reduce((acc, budget) => acc + Number(budget?.amount || 0), 0);
      const budgetTotalSpent = budgets.reduce((acc, budget) => acc + Number(budget?.spentAmount || 0), 0);
      const savingsTotalSaved = savingsGoals.reduce((acc, goal) => acc + Number(goal?.savedAmount || 0), 0);
      const savingsTotalTarget = savingsGoals.reduce((acc, goal) => acc + Number(goal?.targetAmount || 0), 0);
      const subscriptionsMonthlyTotal = subscriptions.reduce((total, subscription) => {
        const amount = Number(subscription?.amount || 0);

        switch (subscription?.billingCycle) {
          case 'weekly':
            return total + (amount * 52) / 12;
          case 'yearly':
            return total + amount / 12;
          default:
            return total + amount;
        }
      }, 0);

      set(() => ({
        expense: {
          total: expenseTotal,
          count: expenses.length,
          categories: calculateCategoriesCount(expenses),
        },
        income: {
          total: incomeTotal,
          count: incomes.length,
          categories: calculateCategoriesCount(incomes),
        },
        budget: {
          totalBudgeted: budgetTotalBudgeted,
          totalSpent: budgetTotalSpent,
          totalProgress: budgetTotalBudgeted > 0 ? Math.min(budgetTotalSpent / budgetTotalBudgeted, 1) : 0,
          count: budgets.length,
        },
        savings: {
          totalSaved: savingsTotalSaved,
          totalTarget: savingsTotalTarget,
          progressPercent: savingsTotalTarget > 0 ? (savingsTotalSaved / savingsTotalTarget) * 100 : 0,
          goalsCount: savingsGoals.length,
        },
        subscription: {
          activeCount: subscriptions.length,
          monthlyTotal: subscriptionsMonthlyTotal,
          annualTotal: subscriptionsMonthlyTotal * 12,
        },
        updatedAt: Date.now(),
        isRefreshing: false,
      }));

      await persistMetrics(get());
    } catch (error) {
      console.error('Failed to refresh finance metrics', error?.response?.data || error.message);
      set(() => ({ isRefreshing: false }));
    }
  },

  setExpenseMetrics: (payload) => {
    set(() => ({
      expense: {
        total: Number(payload?.total || 0),
        count: Number(payload?.count || 0),
        categories: Number(payload?.categories || 0),
      },
      updatedAt: Date.now(),
    }));
    persistMetrics(get());
  },

  setIncomeMetrics: (payload) => {
    set(() => ({
      income: {
        total: Number(payload?.total || 0),
        count: Number(payload?.count || 0),
        categories: Number(payload?.categories || 0),
      },
      updatedAt: Date.now(),
    }));
    persistMetrics(get());
  },

  setBudgetMetrics: (payload) => {
    set(() => ({
      budget: {
        totalBudgeted: Number(payload?.totalBudgeted || 0),
        totalSpent: Number(payload?.totalSpent || 0),
        totalProgress: Number(payload?.totalProgress || 0),
        count: Number(payload?.count || 0),
      },
      updatedAt: Date.now(),
    }));
    persistMetrics(get());
  },

  setSavingsMetrics: (payload) => {
    set(() => ({
      savings: {
        totalSaved: Number(payload?.totalSaved || 0),
        totalTarget: Number(payload?.totalTarget || 0),
        progressPercent: Number(payload?.progressPercent || 0),
        goalsCount: Number(payload?.goalsCount || 0),
      },
      updatedAt: Date.now(),
    }));
    persistMetrics(get());
  },

  setSubscriptionMetrics: (payload) => {
    set(() => ({
      subscription: {
        activeCount: Number(payload?.activeCount || 0),
        monthlyTotal: Number(payload?.monthlyTotal || 0),
        annualTotal: Number(payload?.annualTotal || 0),
      },
      updatedAt: Date.now(),
    }));
    persistMetrics(get());
  },

  resetFinanceMetrics: async () => {
    await SecureStore.deleteItemAsync(FINANCE_METRICS_KEY);
    set(() => ({ ...initialState }));
  },
}));

export default useFinanceStore;
