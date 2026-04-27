import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ActivityIndicator, Button, Card, Dialog, IconButton, Menu, Portal, Text, TextInput } from 'react-native-paper';
import { useNavigation } from 'expo-router';
import Sidebar from '../../components/Sidebar';
import useAuthStore from '../../store/Authstore';
import useFinanceStore from '../../store/financeStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const incomeCategoryOptions = ['Salary', 'Freelance', 'Investment', 'Other'];

const emptyIncomeForm = {
	title: '',
	category: '',
	amount: '',
	description: '',
	date: '',
};

const formatDate = (value) => {
	if (!value) return '-';
	const parsedDate = new Date(value);
	if (Number.isNaN(parsedDate.getTime())) return '-';
	return parsedDate.toLocaleDateString('en-GB');
};

const formatCurrency = (value) => `Rs.${Number(value || 0).toFixed(2)}`;

const IncomeScreen = () => {
	const navigation = useNavigation();
	const token = useAuthStore((state) => state.token);
	const setIncomeMetrics = useFinanceStore((state) => state.setIncomeMetrics);
	const authHeaders = token ? { 'x-auth-token': token } : {};

	const [activeRoute] = useState('income');
	const [incomes, setIncomes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [isDialogVisible, setDialogVisible] = useState(false);
	const [editingIncomeId, setEditingIncomeId] = useState('');
	const [incomeForm, setIncomeForm] = useState(emptyIncomeForm);
	const [selectedDate, setSelectedDate] = useState(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showCategoryMenu, setShowCategoryMenu] = useState(false);

	const fetchIncomes = useCallback(async () => {
		if (!API_BASE_URL || !token) {
			setLoading(false);
			return;
		}

		try {
			const response = await axios.get(`${API_BASE_URL}/income`, {
				headers: authHeaders,
			});
			setIncomes(Array.isArray(response.data) ? response.data : []);
		} catch (error) {
			Alert.alert('Load failed', error?.response?.data?.message || error.message || 'Unable to load income records');
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		fetchIncomes();
	}, [fetchIncomes]);

	const summary = useMemo(() => {
		const total = incomes.reduce((acc, income) => acc + Number(income?.amount || 0), 0);
		const categories = new Set(incomes.map((income) => (income?.category || '').trim()).filter(Boolean)).size;

		return {
			total,
			count: incomes.length,
			categories,
		};
	}, [incomes]);

	useEffect(() => {
		setIncomeMetrics(summary);
	}, [summary, setIncomeMetrics]);

	const resetForm = () => {
		setIncomeForm(emptyIncomeForm);
		setEditingIncomeId('');
		setSelectedDate(null);
		setShowDatePicker(false);
		setShowCategoryMenu(false);
	};

	const openCreateDialog = () => {
		resetForm();
		setDialogVisible(true);
	};

	const openEditDialog = (income) => {
		const dateValue = income?.date ? new Date(income.date) : null;

		setEditingIncomeId(income?._id || '');
		setIncomeForm({
			title: income?.title || '',
			category: income?.category || '',
			amount: income?.amount !== undefined ? String(income.amount) : '',
			description: income?.description || '',
			date: dateValue ? dateValue.toISOString().slice(0, 10) : '',
		});
		setSelectedDate(dateValue);
		setShowDatePicker(false);
		setShowCategoryMenu(false);
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
			setIncomeForm((current) => ({
				...current,
				date: dateValue.toISOString().slice(0, 10),
			}));
		}
	};

	const validateForm = () => {
		const amount = Number(incomeForm.amount);

		if (!incomeForm.title.trim()) {
			Alert.alert('Invalid input', 'Enter an income title.');
			return false;
		}

		if (!amount || amount <= 0) {
			Alert.alert('Invalid input', 'Enter a valid income amount.');
			return false;
		}

		if (!incomeForm.date) {
			Alert.alert('Invalid input', 'Select an income date.');
			return false;
		}

		return true;
	};

	const handleSaveIncome = async () => {
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
				title: incomeForm.title.trim(),
				category: incomeForm.category.trim() || undefined,
				amount: Number(incomeForm.amount),
				description: incomeForm.description.trim() || undefined,
				date: incomeForm.date,
			};

			if (editingIncomeId) {
				await axios.put(`${API_BASE_URL}/income/update/${editingIncomeId}`, payload, {
					headers: authHeaders,
				});
			} else {
				await axios.post(`${API_BASE_URL}/income/create`, payload, {
					headers: authHeaders,
				});
			}

			closeDialog();
			await fetchIncomes();
		} catch (error) {
			Alert.alert(
				editingIncomeId ? 'Update failed' : 'Create failed',
				error?.response?.data?.message || error.message || 'Please try again'
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteIncome = (incomeId) => {
		Alert.alert('Delete income', 'Are you sure you want to delete this income record?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					if (!incomeId) return;

					try {
						setSubmitting(true);
						await axios.delete(`${API_BASE_URL}/income/delete/${incomeId}`, {
							headers: authHeaders,
						});
						await fetchIncomes();
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
						<Text style={styles.title}>Income</Text>
						<Text style={styles.subtitle}>Track and manage your income.</Text>
					</View>
				</View>

				<Button mode="contained" icon="plus" onPress={openCreateDialog} style={styles.inlineAddButton}>
					Add Income
				</Button>

				<View style={styles.summaryRow}>
					<Card style={styles.summaryCard}>
						<Card.Content>
							<Text style={styles.summaryLabel}>Total Income</Text>
							<Text style={styles.summaryValue}>{formatCurrency(summary.total)}</Text>
						</Card.Content>
					</Card>

					<Card style={styles.summaryCard}>
						<Card.Content>
							<Text style={styles.summaryLabel}>Transactions</Text>
							<Text style={styles.summaryValue}>{summary.count}</Text>
						</Card.Content>
					</Card>
				</View>

				<View style={styles.sectionHeaderRow}>
					<Text style={styles.sectionTitle}>Income History</Text>
					<Text style={styles.sectionHint}>{loading ? 'Loading...' : `${incomes.length} item(s)`}</Text>
				</View>

				{loading ? (
					<View style={styles.loadingWrap}>
						<ActivityIndicator animating size="large" />
					</View>
				) : null}

				{!loading && incomes.length === 0 ? (
					<Card style={styles.emptyCard}>
						<Card.Content>
							<Text style={styles.emptyTitle}>No income records yet</Text>
							<Text style={styles.emptyText}>Create your first income record to start tracking earnings.</Text>
						</Card.Content>
					</Card>
				) : null}

				{incomes.map((income, index) => {
					const lastItemStyle = index === incomes.length - 1 ? styles.lastCard : null;

					return (
						<Card key={income._id} style={[styles.incomeCard, lastItemStyle]}>
							<Card.Content>
								<View style={styles.cardTopRow}>
									<View style={styles.cardTitleWrap}>
										<Text style={styles.cardTitle}>{income.title}</Text>
										<Text style={styles.cardSubtitle}>{income.category || 'Uncategorized'}</Text>
									</View>
									<Text style={styles.cardAmount}>{formatCurrency(income.amount)}</Text>
								</View>

								<View style={styles.metaRow}>
									<View style={styles.pillChipSoft}>
										<Text style={styles.pillChipSoftText}>{formatDate(income.date)}</Text>
									</View>
								</View>

								{income.description ? <Text style={styles.descriptionText}>{income.description}</Text> : null}

								<View style={styles.actionsRow}>
									<IconButton icon="pencil" size={20} iconColor="#6B7280" onPress={() => openEditDialog(income)} />
									<IconButton icon="delete" size={20} iconColor="#D32F2F" onPress={() => handleDeleteIncome(income._id)} />
								</View>
							</Card.Content>
						</Card>
					);
				})}
			</ScrollView>

			<Portal>
				<Dialog visible={isDialogVisible} onDismiss={closeDialog}>
					<Dialog.Title>{editingIncomeId ? 'Edit Income' : 'Add Income'}</Dialog.Title>
					<Dialog.Content>
						<TextInput
							label="Title"
							mode="outlined"
							value={incomeForm.title}
							onChangeText={(text) => setIncomeForm((current) => ({ ...current, title: text }))}
							style={styles.dialogInput}
						/>
						<Menu
							visible={showCategoryMenu}
							onDismiss={() => setShowCategoryMenu(false)}
							anchor={
								<Pressable style={styles.selectField} onPress={() => setShowCategoryMenu(true)}>
									<Text style={styles.selectFieldLabel}>Category</Text>
									<View style={styles.selectFieldRow}>
										<Text style={incomeForm.category ? styles.selectFieldValue : styles.selectFieldPlaceholder}>
											{incomeForm.category || 'Select category'}
										</Text>
										<Text style={styles.selectFieldIcon}>⌄</Text>
									</View>
								</Pressable>
							}
						>
							{incomeCategoryOptions.map((option) => (
								<Menu.Item
									key={option}
									title={option}
									titleStyle={incomeForm.category === option ? styles.selectedMenuItemText : styles.menuItemText}
									style={incomeForm.category === option ? styles.selectedMenuItem : null}
									leadingIcon={incomeForm.category === option ? 'check' : undefined}
									onPress={() => {
										setIncomeForm((current) => ({ ...current, category: option }));
										setShowCategoryMenu(false);
									}}
								/>
							))}
						</Menu>

						<TextInput
							label="Amount"
							mode="outlined"
							keyboardType="numeric"
							value={incomeForm.amount}
							onChangeText={(text) => setIncomeForm((current) => ({ ...current, amount: text }))}
							style={styles.dialogInput}
						/>

						<TextInput
							label="Description"
							mode="outlined"
							value={incomeForm.description}
							onChangeText={(text) => setIncomeForm((current) => ({ ...current, description: text }))}
							style={styles.dialogInput}
							multiline
						/>

						<Button mode="outlined" icon="calendar" onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
							{incomeForm.date ? `Date: ${incomeForm.date}` : 'Select Date'}
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
						<Button loading={submitting} onPress={handleSaveIncome}>
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
		maxWidth: 320,
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
	incomeCard: {
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
		fontSize: 12,
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
	descriptionText: {
		marginTop: 10,
		color: '#6B7280',
		lineHeight: 20,
	},
	actionsRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginTop: 8,
	},
	dialogInput: {
		marginBottom: 10,
	},
	hiddenCategoryInput: {
		height: 0,
		marginBottom: 0,
		padding: 0,
		opacity: 0,
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

export default IncomeScreen;
