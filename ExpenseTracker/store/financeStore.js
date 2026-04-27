import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const FINANCE_METRICS_KEY = 'financeMetrics';

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
  updatedAt: null,
};

const persistMetrics = async (snapshot) => {
  const payload = {
    expense: snapshot.expense,
    income: snapshot.income,
    budget: snapshot.budget,
    savings: snapshot.savings,
    subscription: snapshot.subscription,
    updatedAt: snapshot.updatedAt,
  };

  await SecureStore.setItemAsync(FINANCE_METRICS_KEY, JSON.stringify(payload));
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
