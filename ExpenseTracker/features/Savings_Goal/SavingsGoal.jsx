import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Card, ProgressBar, Button, IconButton, TextInput, Portal, Dialog } from 'react-native-paper';
import { useNavigation } from 'expo-router';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import Sidebar from '../../components/Sidebar';
import useAuthStore from '../../store/Authstore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const SavingsDashboard = () => {
  const navigation = useNavigation();
  const token = useAuthStore((state) => state.token);
  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRoute] = useState('savingsGoal');
  const [isGoalDialogVisible, setGoalDialogVisible] = useState(false);
  const [goalNameInput, setGoalNameInput] = useState('');
  const [goalTargetInput, setGoalTargetInput] = useState('');
  const [goalDueDateInput, setGoalDueDateInput] = useState('');
  const [goalDueDateValue, setGoalDueDateValue] = useState(null);
  const [showGoalDatePicker, setShowGoalDatePicker] = useState(false);
  const [isEditGoalDialogVisible, setEditGoalDialogVisible] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState('');
  const [editGoalNameInput, setEditGoalNameInput] = useState('');
  const [editGoalTargetInput, setEditGoalTargetInput] = useState('');
  const [editGoalDueDateInput, setEditGoalDueDateInput] = useState('');
  const [editGoalDueDateValue, setEditGoalDueDateValue] = useState(null);
  const [showEditGoalDatePicker, setShowEditGoalDatePicker] = useState(false);
  const [isSavingsDialogVisible, setSavingsDialogVisible] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [savingsAmountInput, setSavingsAmountInput] = useState('');
  const [savingsDateInput, setSavingsDateInput] = useState('');
  const [savingsDateValue, setSavingsDateValue] = useState(null);
  const [showSavingsDatePicker, setShowSavingsDatePicker] = useState(false);
  const [isEditDialogVisible, setEditDialogVisible] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState('');
  const [editAmountInput, setEditAmountInput] = useState('');
  const [editDateInput, setEditDateInput] = useState('');
  const [editDateValue, setEditDateValue] = useState(null);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = token ? { 'x-auth-token': token } : {};

  const fetchData = useCallback(async () => {
    if (!API_BASE_URL || !token) {
      console.error('Missing API base URL or auth token for savings requests');
      setLoading(false);
      return;
    }

    try {
      const goalRes = await axios.get(`${API_BASE_URL}/savings-goals`, { headers: authHeaders });
      const transRes = await axios.get(`${API_BASE_URL}/savings-goals/transactions/all`, { headers: authHeaders });
      setGoals(goalRes.data.savingsGoals || []);
      setTransactions(transRes.data.transactions || []);
    } catch (err) {
      console.error('Error fetching savings data', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch data from your Express API
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals for summary cards
  const totalSaved = goals.reduce((acc, curr) => acc + curr.savedAmount, 0);
  const totalTarget = goals.reduce((acc, curr) => acc + curr.targetAmount, 0);
  const progressPercent = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB');
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransactionId(transaction?._id || '');
    setEditAmountInput(String(transaction?.amount || ''));
    const initialDate = transaction?.transactionDate
      ? new Date(transaction.transactionDate).toISOString().slice(0, 10)
      : '';
    setEditDateInput(initialDate);
    setEditDateValue(transaction?.transactionDate ? new Date(transaction.transactionDate) : null);
    setShowEditDatePicker(false);
    setEditDialogVisible(true);
  };

  const handleDeleteTransaction = (transactionId) => {
    Alert.alert('Delete transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!transactionId) return;
          try {
            setSubmitting(true);
            await axios.delete(`${API_BASE_URL}/savings-goals/transactions/delete/${transactionId}`, {
              headers: authHeaders,
            });
            await fetchData();
          } catch (err) {
            Alert.alert('Delete failed', err?.response?.data?.message || err.message || 'Try again');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const handleAddGoal = async () => {
    const targetAmount = Number(goalTargetInput);
    if (!goalNameInput.trim() || !targetAmount || targetAmount <= 0) {
      Alert.alert('Invalid input', 'Enter goal name and a valid target amount.');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${API_BASE_URL}/savings-goals/create`,
        {
          goalName: goalNameInput.trim(),
          targetAmount,
          dueDate: goalDueDateInput.trim() || undefined,
        },
        { headers: authHeaders }
      );
      setGoalDialogVisible(false);
      setGoalNameInput('');
      setGoalTargetInput('');
      setGoalDueDateInput('');
      setGoalDueDateValue(null);
      await fetchData();
    } catch (err) {
      Alert.alert('Add goal failed', err?.response?.data?.message || err.message || 'Try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoalDateChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowGoalDatePicker(false);
    }

    if (selectedDate) {
      setGoalDueDateValue(selectedDate);
      setGoalDueDateInput(selectedDate.toISOString().slice(0, 10));
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoalId(goal?._id || '');
    setEditGoalNameInput(goal?.goalName || '');
    setEditGoalTargetInput(String(goal?.targetAmount || ''));
    const initialDate = goal?.dueDate ? new Date(goal.dueDate) : null;
    setEditGoalDueDateValue(initialDate);
    setEditGoalDueDateInput(initialDate ? initialDate.toISOString().slice(0, 10) : '');
    setShowEditGoalDatePicker(false);
    setEditGoalDialogVisible(true);
  };

  const handleEditGoalDateChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowEditGoalDatePicker(false);
    }

    if (selectedDate) {
      setEditGoalDueDateValue(selectedDate);
      setEditGoalDueDateInput(selectedDate.toISOString().slice(0, 10));
    }
  };

  const handleUpdateGoal = async () => {
    const targetAmount = Number(editGoalTargetInput);
    if (!editingGoalId || !editGoalNameInput.trim() || !targetAmount || targetAmount <= 0) {
      Alert.alert('Invalid input', 'Enter goal name and a valid target amount.');
      return;
    }

    try {
      setSubmitting(true);
      await axios.put(
        `${API_BASE_URL}/savings-goals/update/${editingGoalId}`,
        {
          goalName: editGoalNameInput.trim(),
          targetAmount,
          dueDate: editGoalDueDateInput.trim() || undefined,
        },
        { headers: authHeaders }
      );
      setEditGoalDialogVisible(false);
      setEditingGoalId('');
      setEditGoalNameInput('');
      setEditGoalTargetInput('');
      setEditGoalDueDateInput('');
      setEditGoalDueDateValue(null);
      setShowEditGoalDatePicker(false);
      await fetchData();
    } catch (err) {
      Alert.alert('Update goal failed', err?.response?.data?.message || err.message || 'Try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSavings = async () => {
    const amount = Number(savingsAmountInput);
    if (!selectedGoalId || !amount || amount <= 0) {
      Alert.alert('Invalid input', 'Select a goal and enter a valid savings amount.');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${API_BASE_URL}/savings-goals/transactions/add`,
        {
          savingsGoalId: selectedGoalId,
          amount,
          transactionDate: savingsDateInput.trim() || undefined,
        },
        { headers: authHeaders }
      );
      setSavingsDialogVisible(false);
      setSelectedGoalId('');
      setSavingsAmountInput('');
      setSavingsDateInput('');
      setSavingsDateValue(null);
      setShowSavingsDatePicker(false);
      await fetchData();
    } catch (err) {
      Alert.alert('Add savings failed', err?.response?.data?.message || err.message || 'Try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavingsDateChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowSavingsDatePicker(false);
    }

    if (selectedDate) {
      setSavingsDateValue(selectedDate);
      setSavingsDateInput(selectedDate.toISOString().slice(0, 10));
    }
  };

  const handleEditDateChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowEditDatePicker(false);
    }

    if (selectedDate) {
      setEditDateValue(selectedDate);
      setEditDateInput(selectedDate.toISOString().slice(0, 10));
    }
  };

  const handleUpdateTransaction = async () => {
    const amount = Number(editAmountInput);
    if (!editingTransactionId || !amount || amount <= 0) {
      Alert.alert('Invalid input', 'Enter a valid amount.');
      return;
    }

    try {
      setSubmitting(true);
      await axios.put(
        `${API_BASE_URL}/savings-goals/transactions/update/${editingTransactionId}`,
        {
          amount,
          transactionDate: editDateInput.trim() || undefined,
        },
        { headers: authHeaders }
      );
      setEditDialogVisible(false);
      setEditingTransactionId('');
      setEditAmountInput('');
      setEditDateInput('');
      setEditDateValue(null);
      setShowEditDatePicker(false);
      await fetchData();
    } catch (err) {
      Alert.alert('Update failed', err?.response?.data?.message || err.message || 'Try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Sidebar navigation={navigation} activeRoute={activeRoute} />
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Savings Goals</Text>
      </View>

      {/* Summary Cards mirroring your web UI */}
      <View style={styles.row}>
        <Card style={styles.miniCard}>
          <Card.Content>
            <Text variant="labelSmall">TOTAL SAVED</Text>
            <Text variant="titleLarge">Rs.{totalSaved.toLocaleString()}</Text>
          </Card.Content>
        </Card>
        <Card style={styles.miniCard}>
          <Card.Content>
            <Text variant="labelSmall">PROGRESS</Text>
            <Text variant="titleLarge">{progressPercent.toFixed(0)}%</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Goal Progress Section */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Progress by Goal</Text>
      {goals.map((goal) => (
        <Card key={goal._id} style={styles.goalCard}>
          <Card.Content>
            <View style={styles.goalHeader}>
              <Text variant="bodyLarge">{goal.goalName}</Text>
              <View style={styles.goalHeaderRight}>
                <Text variant="bodyLarge" style={{ color: '#4CAF50' }}>
                  {((goal.savedAmount / goal.targetAmount) * 100).toFixed(0)}%
                </Text>
                <IconButton
                  icon="pencil"
                  size={18}
                  iconColor="#6B7280"
                  style={styles.goalEditIcon}
                  onPress={() => handleEditGoal(goal)}
                />
              </View>
            </View>
            <ProgressBar 
              progress={goal.savedAmount / goal.targetAmount} 
              color="#4CAF50" 
              style={styles.progressBar} 
            />
            <Text variant="labelSmall">Rs.{goal.savedAmount} of Rs.{goal.targetAmount} saved</Text>
          </Card.Content>
        </Card>
      ))}

      {/* Recent Transactions Card List */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Recent Savings</Text>
      <View style={styles.actionButtonsRow}>
        <Button mode="contained" onPress={() => setGoalDialogVisible(true)} icon="plus">Add Goal</Button>
        <Button mode="outlined" onPress={() => setSavingsDialogVisible(true)} icon="cash-plus">+Savings</Button>
      </View>

      {transactions.slice(0, 5).map((item) => (
        <Card key={item._id} style={styles.transactionCard}>
          <Card.Content>
            <View style={styles.transactionTopRow}>
              <Text style={styles.transactionGoalName}>{item.savingsGoalId?.goalName || 'Goal'}</Text>
              <Text style={styles.transactionAmount}>Rs.{Number(item.amount || 0).toFixed(2)}</Text>
            </View>

            <View style={styles.transactionMiddleRow}>
              <View style={styles.transactionTypeChip}>
                <IconButton icon="cash-plus" size={18} iconColor="#2E7D32" style={styles.inlineIcon} />
                <Text style={styles.transactionTypeText}>Savings</Text>
              </View>
              <Text style={styles.transactionDate}>{formatDate(item.transactionDate)}</Text>
            </View>

            <View style={styles.transactionActionsRow}>
              <IconButton
                icon="pencil"
                size={22}
                iconColor="#6B7280"
                onPress={() => handleEditTransaction(item)}
              />
              <IconButton
                icon="delete"
                size={22}
                iconColor="#D32F2F"
                onPress={() => handleDeleteTransaction(item._id)}
              />
            </View>
          </Card.Content>
        </Card>
      ))}

      <Portal>
        <Dialog visible={isGoalDialogVisible} onDismiss={() => setGoalDialogVisible(false)}>
          <Dialog.Title>Add Goal</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Goal Name"
              mode="outlined"
              value={goalNameInput}
              onChangeText={setGoalNameInput}
              style={styles.dialogInput}
            />
            <TextInput
              label="Target Amount"
              mode="outlined"
              keyboardType="numeric"
              value={goalTargetInput}
              onChangeText={setGoalTargetInput}
              style={styles.dialogInput}
            />
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setShowGoalDatePicker(true)}
              style={styles.dateSelectorButton}
            >
              {goalDueDateInput ? `Due Date: ${goalDueDateInput}` : 'Select Due Date'}
            </Button>

            {showGoalDatePicker && (
              <DateTimePicker
                value={goalDueDateValue || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleGoalDateChange}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setGoalDialogVisible(false);
                setShowGoalDatePicker(false);
              }}
            >
              Cancel
            </Button>
            <Button loading={submitting} onPress={handleAddGoal}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={isSavingsDialogVisible} onDismiss={() => setSavingsDialogVisible(false)}>
          <Dialog.Title>Add Savings</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.goalSelectLabel}>Select Goal</Text>
            <View style={styles.goalSelectWrap}>
              {goals.map((goal) => (
                <Button
                  key={goal._id}
                  mode={selectedGoalId === goal._id ? 'contained' : 'outlined'}
                  compact
                  style={styles.goalSelectButton}
                  onPress={() => setSelectedGoalId(goal._id)}
                >
                  {goal.goalName}
                </Button>
              ))}
            </View>
            <TextInput
              label="Amount"
              mode="outlined"
              keyboardType="numeric"
              value={savingsAmountInput}
              onChangeText={setSavingsAmountInput}
              style={styles.dialogInput}
            />
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setShowSavingsDatePicker(true)}
              style={styles.dateSelectorButton}
            >
              {savingsDateInput ? `Date: ${savingsDateInput}` : 'Select Date'}
            </Button>

            {showSavingsDatePicker && (
              <DateTimePicker
                value={savingsDateValue || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleSavingsDateChange}
                maximumDate={new Date()}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setSavingsDialogVisible(false);
                setShowSavingsDatePicker(false);
              }}
            >
              Cancel
            </Button>
            <Button loading={submitting} onPress={handleAddSavings}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={isEditGoalDialogVisible} onDismiss={() => setEditGoalDialogVisible(false)}>
          <Dialog.Title>Edit Goal</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Goal Name"
              mode="outlined"
              value={editGoalNameInput}
              onChangeText={setEditGoalNameInput}
              style={styles.dialogInput}
            />
            <TextInput
              label="Target Amount"
              mode="outlined"
              keyboardType="numeric"
              value={editGoalTargetInput}
              onChangeText={setEditGoalTargetInput}
              style={styles.dialogInput}
            />
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setShowEditGoalDatePicker(true)}
              style={styles.dateSelectorButton}
            >
              {editGoalDueDateInput ? `Due Date: ${editGoalDueDateInput}` : 'Select Due Date'}
            </Button>

            {showEditGoalDatePicker && (
              <DateTimePicker
                value={editGoalDueDateValue || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEditGoalDateChange}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setEditGoalDialogVisible(false);
                setShowEditGoalDatePicker(false);
              }}
            >
              Cancel
            </Button>
            <Button loading={submitting} onPress={handleUpdateGoal}>Update</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={isEditDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Edit Savings Transaction</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Amount"
              mode="outlined"
              keyboardType="numeric"
              value={editAmountInput}
              onChangeText={setEditAmountInput}
              style={styles.dialogInput}
            />
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setShowEditDatePicker(true)}
              style={styles.dateSelectorButton}
            >
              {editDateInput ? `Date: ${editDateInput}` : 'Select Date'}
            </Button>

            {showEditDatePicker && (
              <DateTimePicker
                value={editDateValue || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEditDateChange}
                maximumDate={new Date()}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setEditDialogVisible(false);
                setShowEditDatePicker(false);
              }}
            >
              Cancel
            </Button>
            <Button loading={submitting} onPress={handleUpdateTransaction}>Update</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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

  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  
  header:{ 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 20,
    marginBottom: 20 
},

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  miniCard: { width: '48%', backgroundColor: '#fff' },
  sectionTitle: { marginVertical: 12, fontWeight: 'bold' },
  goalCard: { marginBottom: 10, backgroundColor: '#fff' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalEditIcon: {
    margin: 0,
    marginLeft: 4,
  },
  progressBar: { height: 8, borderRadius: 4, marginBottom: 4 },
  dialogInput: {
    marginTop: 10,
  },
  dateSelectorButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  goalSelectLabel: {
    marginBottom: 8,
    color: '#374151',
  },
  goalSelectWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  goalSelectButton: {
    marginBottom: 6,
  },

  transactionCard: {
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  transactionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  transactionGoalName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  transactionMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    paddingRight: 14,
  },
  inlineIcon: {
    margin: 0,
    marginRight: 2,
  },
  transactionTypeText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 16,
    color: '#6B7280',
  },
  transactionActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  }
});

export default SavingsDashboard;