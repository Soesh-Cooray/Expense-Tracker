import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Avatar, ProgressBar } from 'react-native-paper';
import { PieChart } from 'react-native-gifted-charts';
import { useNavigation } from 'expo-router';
import useAuthStore from '../store/Authstore';
import useFinanceStore from '../store/financeStore';
import Sidebar from '../components/Sidebar';

const formatCurrency = (value) => `Rs.${Number(value || 0).toFixed(2)}`;

const DashboardScreen = () => {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const expense = useFinanceStore((state) => state.expense);
  const income = useFinanceStore((state) => state.income);
  const budget = useFinanceStore((state) => state.budget);
  const savings = useFinanceStore((state) => state.savings);
  const subscription = useFinanceStore((state) => state.subscription);
  const updatedAt = useFinanceStore((state) => state.updatedAt);
  const userName = user?.name || user?.username || user?.email || "User"; 
  const userImageUrl = user?.imageUrl || user?.profilePicture || user?.avatar || '';
  const userInitial = userName.charAt(0).toUpperCase();
  const [activeRoute] = useState('dashboard');

  const netBalance = useMemo(() => {
    return Number(income.total || 0) - Number(expense.total || 0) - Number(savings.totalSaved || 0);
  }, [income.total, expense.total, savings.totalSaved]);

  const budgetRatio = useMemo(() => {
    if (!budget.totalBudgeted) return 0;
    return Math.min(Number(budget.totalSpent || 0) / Number(budget.totalBudgeted || 1), 1);
  }, [budget.totalSpent, budget.totalBudgeted]);

  const savingsRatio = useMemo(() => {
    if (!savings.totalTarget) return 0;
    return Math.min(Number(savings.totalSaved || 0) / Number(savings.totalTarget || 1), 1);
  }, [savings.totalSaved, savings.totalTarget]);

  const pieData = [
    { value: Math.max(Number(income.total || 0), 0), color: '#10B981', text: 'Income' },
    { value: Math.max(Number(expense.total || 0), 0), color: '#EF4444', text: 'Expenses' },
    { value: Math.max(Number(savings.totalSaved || 0), 0), color: '#177AD5', text: 'Savings' },
  ].filter((item) => item.value > 0);

  return (
    <View style={styles.wrapper}>
      <Sidebar navigation={navigation} activeRoute={activeRoute} />
      <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello,</Text>
          <Title style={styles.nameText}>{userName} 👋</Title>
        </View>
        {userImageUrl ? (
          <Avatar.Image size={50} source={{ uri: userImageUrl }} />
        ) : (
          <Avatar.Text size={50} label={userInitial} />
        )}
      </View>

      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Paragraph style={styles.cardLabel}>Net Position</Paragraph>
          <Text style={styles.balanceText}>{formatCurrency(netBalance)}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.stat}>
              <Text style={styles.incomeText}>Income {formatCurrency(income.total)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.expenseText}>Expenses {formatCurrency(expense.total)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.savingsText}>Savings {formatCurrency(savings.totalSaved)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.kpiRow}>
        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text style={styles.kpiLabel}>Expense Transactions</Text>
            <Text style={styles.kpiValue}>{expense.count}</Text>
          </Card.Content>
        </Card>
        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text style={styles.kpiLabel}>Income Transactions</Text>
            <Text style={styles.kpiValue}>{income.count}</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.kpiRow}>
        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text style={styles.kpiLabel}>Active Budgets</Text>
            <Text style={styles.kpiValue}>{budget.count}</Text>
          </Card.Content>
        </Card>
        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text style={styles.kpiLabel}>Savings Goals</Text>
            <Text style={styles.kpiValue}>{savings.goalsCount}</Text>
          </Card.Content>
        </Card>
      </View>

      <Title style={styles.sectionTitle}>Finance Distribution</Title>
      <Card style={styles.chartCard}>
        <Card.Content style={styles.chartContent}>
          {pieData.length > 0 ? (
            <PieChart
              donut
              showText
              textColor="black"
              radius={80}
              textSize={11}
              data={pieData}
              centerLabelComponent={() => {
                return <Text style={{ fontSize: 13, fontWeight: '700' }}>Overview</Text>;
              }}
            />
          ) : (
            <Text>No finance data yet</Text>
          )}
          <View style={styles.chartLegend}>
            <Paragraph style={styles.legendItem}>Income: {formatCurrency(income.total)}</Paragraph>
            <Paragraph style={styles.legendItem}>Expenses: {formatCurrency(expense.total)}</Paragraph>
            <Paragraph style={styles.legendItem}>Savings: {formatCurrency(savings.totalSaved)}</Paragraph>
          </View>
        </Card.Content>
      </Card>

      <Title style={styles.sectionTitle}>Budget Status</Title>
      <Card style={styles.statusCard}>
        <Card.Content>
          <View style={styles.statusTopRow}>
            <Text style={styles.statusTitle}>Usage {(budgetRatio * 100).toFixed(0)}%</Text>
            <Text style={styles.statusTitle}>{budget.count} active</Text>
          </View>
          <ProgressBar progress={budgetRatio} color={budgetRatio >= 1 ? '#DC2626' : '#177AD5'} style={styles.inlineProgress} />
          <Text style={styles.inlineMeta}>Spent {formatCurrency(budget.totalSpent)} / {formatCurrency(budget.totalBudgeted)}</Text>
        </Card.Content>
      </Card>

      <Title style={styles.sectionTitle}>Subscription Status</Title>
      <Card style={styles.statusCard}>
        <Card.Content>
          <View style={styles.statusTopRow}>
            <Text style={styles.statusTitle}>{subscription.activeCount} active</Text>
            <Text style={styles.statusTitle}>Monthly {formatCurrency(subscription.monthlyTotal)}</Text>
          </View>
          <Text style={styles.inlineMeta}>Annual estimate {formatCurrency(subscription.annualTotal)}</Text>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
         <Button icon="minus-circle" mode="contained" style={styles.fab} onPress={() => navigation.navigate('expense')}>
           Add Expense
         </Button>
         <Button icon="plus-circle" mode="outlined" style={styles.fabOutline} onPress={() => navigation.navigate('income')}>
           Add Income
         </Button>
         <Button icon="piggy-bank" mode="outlined" style={styles.fabOutline} onPress={() => navigation.navigate('savingsGoal')}>
           Manage Savings
         </Button>
         <Text style={styles.lastUpdatedText}>
          {updatedAt ? `Last synced from modules: ${new Date(updatedAt).toLocaleTimeString()}` : 'Open each module once to populate dashboard metrics.'}
         </Text>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { 
    flex: 1, 
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 ,marginTop: 50  },
  welcomeText: { fontSize: 16, color: '#666' },
  nameText: { fontSize: 24, fontWeight: 'bold' },
  summaryCard: { backgroundColor: '#173A72', borderRadius: 15, elevation: 4 },
  cardLabel: { color: '#fff', opacity: 0.8 },
  balanceText: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginVertical: 10 },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.3)', marginTop: 10 },
  stat: { width: '100%', marginTop: 8 },
  incomeText: { color: '#4CAF50', fontWeight: 'bold' },
  expenseText: { color: '#FF5252', fontWeight: 'bold' },
  savingsText: { color: '#60A5FA', fontWeight: 'bold' },
  kpiRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  kpiCard: { flex: 1, borderRadius: 12, backgroundColor: '#fff' },
  kpiLabel: { fontSize: 12, color: '#6B7280' },
  kpiValue: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 4 },
  sectionTitle: { marginTop: 25, marginBottom: 10, fontSize: 18 },
  chartCard: { borderRadius: 15, marginBottom: 20 },
  chartContent: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  chartLegend: { marginTop: 14, width: '100%' },
  legendItem: { color: '#374151', fontSize: 14, marginBottom: 6 },
  statusCard: { borderRadius: 15, marginBottom: 8 },
  statusTopRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  statusTitle: { color: '#111827', fontSize: 15, fontWeight: '700' },
  inlineProgress: { height: 7, borderRadius: 8, marginTop: 6, marginBottom: 4 },
  inlineMeta: { color: '#6B7280', fontSize: 12 },
  quickActions: { marginVertical: 20, alignItems: 'center' },
  fab: { width: '80%', borderRadius: 10, marginBottom: 10 },
  fabOutline: { width: '80%', borderRadius: 10, marginBottom: 10 },
  lastUpdatedText: { fontSize: 12, color: '#6B7280', marginTop: 6, textAlign: 'center', paddingHorizontal: 10 },
});

export default DashboardScreen;