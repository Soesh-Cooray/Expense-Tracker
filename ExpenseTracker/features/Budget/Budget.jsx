import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ActivityIndicator, Button, Card, Dialog, IconButton, Menu, Portal, ProgressBar, Text, TextInput } from 'react-native-paper';
import { useNavigation } from 'expo-router';
import Sidebar from '../../components/Sidebar';
import useAuthStore from '../../store/Authstore';
import useFinanceStore from '../../store/financeStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const budgetCategoryOptions = ['Food', 'Transport', 'Utilities', 'Rent', 'Entertainment', 'Health', 'Other'];
const budgetPeriodOptions = ['Weekly', 'Monthly', 'Yearly'];

const emptyBudgetForm = {
	amount: '',
	category: '',
	period: '',
	startDate: '',
};

const formatDate = (value) => {
	if (!value) return '-';
	const parsedDate = new Date(value);
	if (Number.isNaN(parsedDate.getTime())) return '-';
	return parsedDate.toLocaleDateString('en-GB');
};

const formatCurrency = (value) => `Rs.${Number(value || 0).toFixed(2)}`;

const BudgetScreen = () => {
	const navigation = useNavigation();
	const token = useAuthStore((state) => state.token);
	const setBudgetMetrics = useFinanceStore((state) => state.setBudgetMetrics);
	const authHeaders = token ? { 'x-auth-token': token } : {};

	const [activeRoute] = useState('budgets');
	const [budgets, setBudgets] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [isDialogVisible, setDialogVisible] = useState(false);
	const [editingBudgetId, setEditingBudgetId] = useState('');
	const [budgetForm, setBudgetForm] = useState(emptyBudgetForm);
	const [selectedDate, setSelectedDate] = useState(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showCategoryMenu, setShowCategoryMenu] = useState(false);
	const [showPeriodMenu, setShowPeriodMenu] = useState(false);

	const fetchBudgets = useCallback(async () => {
		if (!API_BASE_URL || !token) {
			setLoading(false);
			return;
		}

		try {
			const response = await axios.get(`${API_BASE_URL}/budgets`, {
				headers: authHeaders,
			});
			setBudgets(Array.isArray(response.data) ? response.data : []);
		} catch (error) {
			Alert.alert('Load failed', error?.response?.data?.message || error.message || 'Unable to load budgets');
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		fetchBudgets();
	}, [fetchBudgets]);

	const summary = useMemo(() => {
		const totalBudgeted = budgets.reduce((acc, budget) => acc + Number(budget?.amount || 0), 0);
		const totalSpent = budgets.reduce((acc, budget) => acc + Number(budget?.spentAmount || 0), 0);
		const totalProgress = totalBudgeted > 0 ? Math.min(totalSpent / totalBudgeted, 1) : 0;

		return {
			totalBudgeted,
			totalSpent,
			totalProgress,
			count: budgets.length,
		};
	}, [budgets]);

	useEffect(() => {
		setBudgetMetrics(summary);
	}, [summary, setBudgetMetrics]);

	const resetForm = () => {
		setBudgetForm(emptyBudgetForm);
		setEditingBudgetId('');
		setSelectedDate(null);
		setShowDatePicker(false);
		setShowCategoryMenu(false);
		setShowPeriodMenu(false);
	};

	const openCreateDialog = () => {
		resetForm();
		setDialogVisible(true);
	};

	const openEditDialog = (budget) => {
		const startDateValue = budget?.startDate ? new Date(budget.startDate) : null;

		setEditingBudgetId(budget?._id || '');
		setBudgetForm({
			amount: budget?.amount !== undefined ? String(budget.amount) : '',
			category: budget?.category || '',
			period: budget?.period || '',
			startDate: startDateValue ? startDateValue.toISOString().slice(0, 10) : '',
		});
		setSelectedDate(startDateValue);
		setShowDatePicker(false);
		setShowCategoryMenu(false);
		setShowPeriodMenu(false);
		setDialogVisible(true);
	};

	const closeDialog = () => {
		setDialogVisible(false);
		resetForm();
	};

	const handleDateChange = (_event, dateValue) => {
		if (Platform.OS === 'android') {
			setShowDatePicker(false);
		}

		if (dateValue) {
			setSelectedDate(dateValue);
			setBudgetForm((current) => ({
				...current,
				startDate: dateValue.toISOString().slice(0, 10),
			}));
		}
	};

	const validateForm = () => {
		const amount = Number(budgetForm.amount);

		if (!amount || amount <= 0) {
			Alert.alert('Invalid input', 'Enter a valid budget amount.');
			return false;
		}

		if (!budgetForm.category) {
			Alert.alert('Invalid input', 'Select a category.');
			return false;
		}

		if (!budgetForm.period) {
			Alert.alert('Invalid input', 'Select a period.');
			return false;
		}

		if (!budgetForm.startDate) {
			Alert.alert('Invalid input', 'Select a start date.');
			return false;
		}

		return true;
	};

	const handleSaveBudget = async () => {
		if (!API_BASE_URL) {
			Alert.alert('Configuration error', 'API base URL is missing.');
			return;
		}

		if (!token) {
			Alert.alert('Session expired', 'Please log in again.');
			return;
		}

		if (!validateForm()) return;

		try {
			setSubmitting(true);

			const payload = {
				amount: Number(budgetForm.amount),
				category: budgetForm.category,
				period: budgetForm.period,
				startDate: budgetForm.startDate,
			};

			if (editingBudgetId) {
				await axios.put(`${API_BASE_URL}/budgets/update/${editingBudgetId}`, payload, {
					headers: authHeaders,
				});
			} else {
				await axios.post(`${API_BASE_URL}/budgets/create`, payload, {
					headers: authHeaders,
				});
			}

			closeDialog();
			await fetchBudgets();
		} catch (error) {
			Alert.alert(
				editingBudgetId ? 'Update failed' : 'Create failed',
				error?.response?.data?.message || error.message || 'Please try again'
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteBudget = (budgetId) => {
		Alert.alert('Delete budget', 'Are you sure you want to delete this budget?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					if (!budgetId) return;

					try {
						setSubmitting(true);
						await axios.delete(`${API_BASE_URL}/budgets/delete/${budgetId}`, {
							headers: authHeaders,
						});
						await fetchBudgets();
					} catch (error) {
						Alert.alert('Delete failed', error?.response?.data?.message || error.message || 'Please try again');
					} finally {
						setSubmitting(false);
					}
				},
			},
		]);
	};

	return (
		<View style={styles.wrapper}>
			<Sidebar navigation={navigation} activeRoute={activeRoute} />

			<ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
				<View style={styles.headerRow}>
					<View>
						<Text style={styles.title}>Budgets</Text>
						<Text style={styles.subtitle}>Track category budgets with automatic rollover and expense-based progress.</Text>
					</View>
				</View>

				<Button mode="contained" icon="plus" onPress={openCreateDialog} style={styles.inlineAddButton}>
					Add Budget
				</Button>

				<View style={styles.summaryRow}>
					<Card style={styles.summaryCard}>
						<Card.Content>
							<Text style={styles.summaryLabel}>Total Budgeted</Text>
							<Text style={styles.summaryValue}>{formatCurrency(summary.totalBudgeted)}</Text>
						</Card.Content>
					</Card>

					<Card style={styles.summaryCard}>
						<Card.Content>
							<Text style={styles.summaryLabel}>Total Spent</Text>
							<Text style={styles.summaryValue}>{formatCurrency(summary.totalSpent)}</Text>
						</Card.Content>
					</Card>

					<Card style={styles.summaryCard}>
						<Card.Content>
							<Text style={styles.summaryLabel}>Overall Usage</Text>
							<Text style={styles.summaryValue}>{(summary.totalProgress * 100).toFixed(0)}%</Text>
							<ProgressBar progress={summary.totalProgress} color="#1a73eb" style={styles.progressBar} />
						</Card.Content>
					</Card>
				</View>

				<View style={styles.sectionHeaderRow}>
					<Text style={styles.sectionTitle}>Budget List</Text>
					<Text style={styles.sectionHint}>{loading ? 'Loading...' : `${budgets.length} item(s)`}</Text>
				</View>

				{loading ? (
					<View style={styles.loadingWrap}>
						<ActivityIndicator animating size="large" />
					</View>
				) : null}

				{!loading && budgets.length === 0 ? (
					<Card style={styles.emptyCard}>
						<Card.Content>
							<Text style={styles.emptyTitle}>No budgets yet</Text>
							<Text style={styles.emptyText}>Create budgets to monitor spending per category.</Text>
						</Card.Content>
					</Card>
				) : null}

				{budgets.map((budget, index) => {
					const lastItemStyle = index === budgets.length - 1 ? styles.lastCard : null;
					const budgetAmount = Number(budget?.amount || 0);
					const spentAmount = Number(budget?.spentAmount || 0);
					const progress = budgetAmount > 0 ? Math.min(spentAmount / budgetAmount, 1) : 0;

					return (
						<Card key={budget._id} style={[styles.budgetCard, lastItemStyle]}>
							<Card.Content>
								<View style={styles.cardTopRow}>
									<View style={styles.cardTitleWrap}>
										<Text style={styles.cardTitle}>{budget.category || 'Uncategorized'}</Text>
										<Text style={styles.cardSubtitle}>{budget.period || '-'} Budget</Text>
									</View>
									<Text style={styles.cardAmount}>{formatCurrency(budgetAmount)}</Text>
								</View>

								<View style={styles.metaRow}>
									<View style={styles.pillChipSoft}>
										<Text style={styles.pillChipSoftText}>Start {formatDate(budget.periodStart || budget.startDate)}</Text>
									</View>
									<View style={styles.pillChipSoft}>
										<Text style={styles.pillChipSoftText}>Ends {formatDate(budget.periodEnd)}</Text>
									</View>
								</View>

								<View style={styles.progressHeaderRow}>
									<Text style={styles.progressLabel}>Spent {formatCurrency(spentAmount)}</Text>
									<Text style={styles.progressLabel}>{(progress * 100).toFixed(0)}%</Text>
								</View>

								<ProgressBar progress={progress} color={progress >= 1 ? '#D32F2F' : '#1a73eb'} style={styles.progressBar} />
								<Text style={styles.remainingText}>Remaining {formatCurrency(Math.max(budgetAmount - spentAmount, 0))}</Text>

								<View style={styles.actionsRow}>
									<IconButton icon="pencil" size={20} iconColor="#6B7280" onPress={() => openEditDialog(budget)} />
									<IconButton icon="delete" size={20} iconColor="#D32F2F" onPress={() => handleDeleteBudget(budget._id)} />
								</View>
							</Card.Content>
						</Card>
					);
				})}
			</ScrollView>

			<Portal>
				<Dialog visible={isDialogVisible} onDismiss={closeDialog}>
					<Dialog.Title>{editingBudgetId ? 'Edit Budget' : 'Add Budget'}</Dialog.Title>
					<Dialog.Content>
						<Menu
							visible={showCategoryMenu}
							onDismiss={() => setShowCategoryMenu(false)}
							anchor={
								<Pressable style={styles.selectField} onPress={() => setShowCategoryMenu(true)}>
									<Text style={styles.selectFieldLabel}>Category</Text>
									<View style={styles.selectFieldRow}>
										<Text style={budgetForm.category ? styles.selectFieldValue : styles.selectFieldPlaceholder}>
											{budgetForm.category || 'Select category'}
										</Text>
										<Text style={styles.selectFieldIcon}>⌄</Text>
									</View>
								</Pressable>
							}
						>
							{budgetCategoryOptions.map((option) => (
								<Menu.Item
									key={option}
									title={option}
									titleStyle={budgetForm.category === option ? styles.selectedMenuItemText : styles.menuItemText}
									style={budgetForm.category === option ? styles.selectedMenuItem : null}
									leadingIcon={budgetForm.category === option ? 'check' : undefined}
									onPress={() => {
										setBudgetForm((current) => ({ ...current, category: option }));
										setShowCategoryMenu(false);
									}}
								/>
							))}
						</Menu>

						<TextInput
							label="Amount"
							mode="outlined"
							keyboardType="numeric"
							value={budgetForm.amount}
							onChangeText={(text) => setBudgetForm((current) => ({ ...current, amount: text }))}
							style={styles.dialogInput}
						/>

						<Menu
							visible={showPeriodMenu}
							onDismiss={() => setShowPeriodMenu(false)}
							anchor={
								<Pressable style={styles.selectField} onPress={() => setShowPeriodMenu(true)}>
									<Text style={styles.selectFieldLabel}>Period</Text>
									<View style={styles.selectFieldRow}>
										<Text style={budgetForm.period ? styles.selectFieldValue : styles.selectFieldPlaceholder}>
											{budgetForm.period || 'Select period'}
										</Text>
										<Text style={styles.selectFieldIcon}>⌄</Text>
									</View>
								</Pressable>
							}
						>
							{budgetPeriodOptions.map((option) => (
								<Menu.Item
									key={option}
									title={option}
									titleStyle={budgetForm.period === option ? styles.selectedMenuItemText : styles.menuItemText}
									style={budgetForm.period === option ? styles.selectedMenuItem : null}
									leadingIcon={budgetForm.period === option ? 'check' : undefined}
									onPress={() => {
										setBudgetForm((current) => ({ ...current, period: option }));
										setShowPeriodMenu(false);
									}}
								/>
							))}
						</Menu>

						<Button mode="outlined" icon="calendar" onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
							{budgetForm.startDate ? `Start Date: ${budgetForm.startDate}` : 'Select Start Date'}
						</Button>

						{showDatePicker ? (
							<DateTimePicker
								value={selectedDate || new Date()}
								mode="date"
								display={Platform.OS === 'ios' ? 'spinner' : 'default'}
								onChange={handleDateChange}
							/>
						) : null}
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={closeDialog}>Cancel</Button>
						<Button loading={submitting} onPress={handleSaveBudget}>
							Save
						</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		flexDirection: 'row',
		backgroundColor: '#f5f5f5',
	},
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	contentContainer: {
		padding: 16,
		paddingBottom: 28,
	},
	headerRow: {
		flexDirection: 'column',
		alignItems: 'flex-start',
		marginBottom: 16,
		marginTop: 10,
	},
	title: {
		marginTop: 16,
		fontSize: 28,
		fontWeight: 'bold',
		color: '#111827',
	},
	subtitle: {
		fontSize: 14,
		color: '#6B7280',
		marginTop: 6,
		maxWidth: 360,
	},
	inlineAddButton: {
		borderRadius: 12,
		backgroundColor: '#1a73eb',
		alignSelf: 'flex-start',
		marginBottom: 16,
	},
	summaryRow: {
		flexDirection: 'column',
		gap: 10,
		marginBottom: 16,
	},
	summaryCard: {
		width: '100%',
		borderRadius: 14,
		backgroundColor: '#ffffff',
	},
	summaryLabel: {
		fontSize: 12,
		color: '#6B7280',
	},
	summaryValue: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#111827',
		marginTop: 4,
		marginBottom: 8,
	},
	sectionHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#111827',
	},
	sectionHint: {
		fontSize: 12,
		color: '#6B7280',
	},
	loadingWrap: {
		paddingVertical: 16,
		alignItems: 'center',
	},
	emptyCard: {
		borderRadius: 16,
		backgroundColor: '#ffffff',
		marginBottom: 14,
	},
	emptyTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#111827',
	},
	emptyText: {
		color: '#6B7280',
		marginTop: 6,
	},
	budgetCard: {
		borderRadius: 16,
		backgroundColor: '#ffffff',
		marginBottom: 12,
	},
	lastCard: {
		marginBottom: 0,
	},
	cardTopRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	cardTitleWrap: {
		flex: 1,
		marginRight: 12,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#111827',
	},
	cardSubtitle: {
		fontSize: 13,
		color: '#6B7280',
		marginTop: 2,
	},
	cardAmount: {
		fontSize: 16,
		fontWeight: '700',
		color: '#1a73eb',
	},
	metaRow: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 12,
	},
	pillChipSoft: {
		paddingVertical: 5,
		paddingHorizontal: 10,
		borderRadius: 999,
		backgroundColor: '#f3f4f6',
	},
	pillChipSoftText: {
		color: '#4b5563',
		fontSize: 12,
		fontWeight: '600',
	},
	progressHeaderRow: {
		marginTop: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	progressLabel: {
		color: '#4b5563',
		fontSize: 12,
		fontWeight: '600',
	},
	progressBar: {
		height: 8,
		borderRadius: 8,
		backgroundColor: '#e5e7eb',
		marginTop: 8,
	},
	remainingText: {
		marginTop: 8,
		color: '#6B7280',
		fontSize: 12,
	},
	actionsRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginTop: 8,
	},
	dialogInput: {
		marginBottom: 10,
	},
	selectField: {
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
		backgroundColor: '#ffffff',
		marginBottom: 10,
	},
	selectFieldLabel: {
		fontSize: 12,
		color: '#6B7280',
		marginBottom: 4,
	},
	selectFieldRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	selectFieldValue: {
		fontSize: 16,
		fontWeight: '700',
		color: '#111827',
	},
	selectFieldPlaceholder: {
		fontSize: 16,
		color: '#9ca3af',
	},
	selectFieldIcon: {
		fontSize: 18,
		color: '#6B7280',
		marginLeft: 12,
	},
	selectedMenuItem: {
		backgroundColor: '#eaf1fe',
	},
	selectedMenuItemText: {
		color: '#1a73eb',
		fontWeight: '700',
	},
	menuItemText: {
		color: '#111827',
	},
	dateButton: {
		marginTop: 4,
	},
});

export default BudgetScreen;
