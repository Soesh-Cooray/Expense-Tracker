import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Card, Dialog, IconButton, Portal, ProgressBar, Text, TextInput } from 'react-native-paper';
import { useNavigation } from 'expo-router';
import Sidebar from '../../components/Sidebar';
import useAuthStore from '../../store/Authstore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const emptyFormState = {
	name: '',
	amount: '',
	startDate: '',
	billingCycle: 'monthly',
	category: '',
};

const cycleOrder = ['weekly', 'monthly', 'yearly'];

const formatDate = (value) => {
	if (!value) return '-';
	const parsedDate = new Date(value);
	if (Number.isNaN(parsedDate.getTime())) return '-';
	return parsedDate.toLocaleDateString('en-GB');
};

const getMonthlyEquivalent = (subscription) => {
	const amount = Number(subscription?.amount || 0);
	if (!amount) return 0;

	switch (subscription?.billingCycle) {
		case 'weekly':
			return (amount * 52) / 12;
		case 'yearly':
			return amount / 12;
		default:
			return amount;
	}
};

const SubscriptionScreen = () => {
	const navigation = useNavigation();
	const token = useAuthStore((state) => state.token);
	const authHeaders = token ? { 'x-auth-token': token } : {};

	const [subscriptions, setSubscriptions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [activeRoute] = useState('subscription');
	const [isCreateVisible, setCreateVisible] = useState(false);
	const [isEditVisible, setEditVisible] = useState(false);
	const [editingSubscriptionId, setEditingSubscriptionId] = useState('');
	const [formState, setFormState] = useState(emptyFormState);
	const [formDateValue, setFormDateValue] = useState(null);
	const [showDatePicker, setShowDatePicker] = useState(false);

	const fetchSubscriptions = useCallback(async () => {
		if (!API_BASE_URL || !token) {
			setLoading(false);
			return;
		}

		try {
			const response = await axios.get(`${API_BASE_URL}/subscriptions`, {
				headers: authHeaders,
			});
			setSubscriptions(Array.isArray(response.data) ? response.data : []);
		} catch (error) {
			Alert.alert('Load failed', error?.response?.data?.message || error.message || 'Unable to load subscriptions');
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		fetchSubscriptions();
	}, [fetchSubscriptions]);

	const summary = useMemo(() => {
		const activeCount = subscriptions.length;
		const monthlyTotal = subscriptions.reduce((total, subscription) => total + getMonthlyEquivalent(subscription), 0);
		const annualTotal = monthlyTotal * 12;

		return {
			activeCount,
			monthlyTotal,
			annualTotal,
		};
	}, [subscriptions]);

	const resetForm = () => {
		setFormState(emptyFormState);
		setFormDateValue(null);
		setShowDatePicker(false);
		setEditingSubscriptionId('');
	};

	const openCreateDialog = () => {
		resetForm();
		setCreateVisible(true);
	};

	const openEditDialog = (subscription) => {
		const parsedDate = subscription?.startDate ? new Date(subscription.startDate) : null;

		setEditingSubscriptionId(subscription?._id || '');
		setFormState({
			name: subscription?.name || '',
			amount: subscription?.amount !== undefined ? String(subscription.amount) : '',
			startDate: parsedDate ? parsedDate.toISOString().slice(0, 10) : '',
			billingCycle: subscription?.billingCycle || 'monthly',
			category: subscription?.category || '',
		});
		setFormDateValue(parsedDate);
		setShowDatePicker(false);
		setEditVisible(true);
	};

	const closeDialogs = () => {
		setCreateVisible(false);
		setEditVisible(false);
		resetForm();
	};

	const handleDateChange = (_event, selectedDate) => {
		if (Platform.OS === 'android') {
			setShowDatePicker(false);
		}

		if (selectedDate) {
			setFormDateValue(selectedDate);
			setFormState((current) => ({
				...current,
				startDate: selectedDate.toISOString().slice(0, 10),
			}));
		}
	};

	const validateForm = () => {
		const amount = Number(formState.amount);

		if (!formState.name.trim()) {
			Alert.alert('Invalid input', 'Enter a subscription name.');
			return false;
		}

		if (!amount || amount <= 0) {
			Alert.alert('Invalid input', 'Enter a valid amount.');
			return false;
		}

		if (!formState.startDate) {
			Alert.alert('Invalid input', 'Select a start date.');
			return false;
		}

		if (!cycleOrder.includes(formState.billingCycle)) {
			Alert.alert('Invalid input', 'Choose a billing cycle.');
			return false;
		}

		return true;
	};

	const handleSaveSubscription = async () => {
		if (!validateForm()) return;

		try {
			setSubmitting(true);

			const payload = {
				name: formState.name.trim(),
				amount: Number(formState.amount),
				startDate: formState.startDate,
				billingCycle: formState.billingCycle,
				category: formState.category.trim() || undefined,
			};

			if (editingSubscriptionId) {
				await axios.put(`${API_BASE_URL}/subscriptions/update/${editingSubscriptionId}`, payload, {
					headers: authHeaders,
				});
			} else {
				await axios.post(`${API_BASE_URL}/subscriptions/create`, payload, {
					headers: authHeaders,
				});
			}

			closeDialogs();
			await fetchSubscriptions();
		} catch (error) {
			Alert.alert(
				editingSubscriptionId ? 'Update failed' : 'Create failed',
				error?.response?.data?.message || error.message || 'Please try again'
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteSubscription = (subscriptionId) => {
		Alert.alert('Delete subscription', 'Are you sure you want to delete this subscription?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					if (!subscriptionId) return;

					try {
						setSubmitting(true);
						await axios.delete(`${API_BASE_URL}/subscriptions/delete/${subscriptionId}`, {
							headers: authHeaders,
						});
						await fetchSubscriptions();
					} catch (error) {
						Alert.alert('Delete failed', error?.response?.data?.message || error.message || 'Please try again');
					} finally {
						setSubmitting(false);
					}
				},
			},
		]);
	};

	const renderBillingCycleButton = (cycle) => {
		const labels = {
			weekly: 'Weekly',
			monthly: 'Monthly',
			yearly: 'Yearly',
		};

		const isSelected = formState.billingCycle === cycle;

		return (
			<Button
				key={cycle}
				mode={isSelected ? 'contained' : 'outlined'}
				compact
				onPress={() => setFormState((current) => ({ ...current, billingCycle: cycle }))}
				style={styles.cycleButton}
				contentStyle={styles.cycleButtonContent}
			>
				{labels[cycle]}
			</Button>
		);
	};

	return (
		<View style={styles.wrapper}>
			<Sidebar navigation={navigation} activeRoute={activeRoute} />

			<ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
				<View style={styles.headerRow}>
					<View>
						<Text style={styles.title}>Subscriptions</Text>
						<Text style={styles.subtitle}>Track recurring services with the same clean dashboard style.</Text>
					</View>

					<Button mode="contained" icon="plus" onPress={openCreateDialog} style={styles.primaryButton} contentStyle={styles.primaryButtonContent}>
						Add Subscription
					</Button>
				</View>

				<Button
					mode="contained"
					icon="plus"
					onPress={openCreateDialog}
					style={styles.inlineAddButton}
					contentStyle={styles.inlineAddButtonContent}
				>
					Add Subscription
				</Button>

				<Card style={styles.heroCard}>
					<Card.Content>
						<Text style={styles.heroLabel}>Monthly recurring spend</Text>
						<Text style={styles.heroAmount}>Rs.{summary.monthlyTotal.toFixed(2)}</Text>
						<ProgressBar progress={Math.min(summary.monthlyTotal / 50000, 1)} color="#1a73eb" style={styles.heroProgress} />
						<View style={styles.heroFooterRow}>
							<Text style={styles.heroFooterText}>{summary.activeCount} active subscriptions</Text>
							<Text style={styles.heroFooterText}>Annual est. Rs.{summary.annualTotal.toFixed(2)}</Text>
						</View>
					</Card.Content>
				</Card>

				<View style={styles.summaryRow}>
					<Card style={styles.summaryCard}>
						<Card.Content>
							<Text style={styles.summaryLabel}>Active</Text>
							<Text style={styles.summaryValue}>{summary.activeCount}</Text>
						</Card.Content>
					</Card>
					<Card style={styles.summaryCard}>
						<Card.Content>
							<Text style={styles.summaryLabel}>Monthly</Text>
							<Text style={styles.summaryValue}>Rs.{summary.monthlyTotal.toFixed(0)}</Text>
						</Card.Content>
					</Card>
					<Card style={styles.summaryCard}>
						<Card.Content>
							<Text style={styles.summaryLabel}>Annual</Text>
							<Text style={styles.summaryValue}>Rs.{summary.annualTotal.toFixed(0)}</Text>
						</Card.Content>
					</Card>
				</View>

				<View style={styles.sectionHeaderRow}>
					<Text style={styles.sectionTitle}>All Subscriptions</Text>
					<Text style={styles.sectionHint}>{loading ? 'Loading...' : `${subscriptions.length} item(s)`}</Text>
				</View>

				{subscriptions.length === 0 && !loading ? (
					<Card style={styles.emptyCard}>
						<Card.Content>
							<Text style={styles.emptyTitle}>No subscriptions yet</Text>
							<Text style={styles.emptyText}>Create one to start tracking your recurring payments.</Text>
						</Card.Content>
					</Card>
				) : null}

				{subscriptions.map((subscription, index) => {
					const monthlyEquivalent = getMonthlyEquivalent(subscription);
					const lastItemStyle = index === subscriptions.length - 1 ? styles.lastCard : null;

					return (
						<Card key={subscription._id} style={[styles.subscriptionCard, lastItemStyle]}>
							<Card.Content>
								<View style={styles.cardTopRow}>
									<View style={styles.cardTitleWrap}>
										<Text style={styles.cardTitle}>{subscription.name}</Text>
										<Text style={styles.cardSubtitle}>{subscription.category || 'Uncategorized'}</Text>
									</View>
									<Text style={styles.cardAmount}>Rs.{Number(subscription.amount || 0).toFixed(2)}</Text>
								</View>

								<View style={styles.chipRow}>
									<View style={styles.pillChip}>
										<Text style={styles.pillChipText}>{subscription.billingCycle}</Text>
									</View>
									<View style={styles.pillChipSoft}>
										<Text style={styles.pillChipSoftText}>Start {formatDate(subscription.startDate)}</Text>
									</View>
								</View>

								<View style={styles.progressRow}>
									<Text style={styles.progressLabel}>Monthly equivalent</Text>
									<Text style={styles.progressValue}>Rs.{monthlyEquivalent.toFixed(2)}</Text>
								</View>
								<ProgressBar progress={Math.min(monthlyEquivalent / 20000, 1)} color="#177AD5" style={styles.cardProgress} />

								<View style={styles.actionsRow}>
									<IconButton icon="pencil" size={20} iconColor="#6B7280" onPress={() => openEditDialog(subscription)} />
									<IconButton icon="delete" size={20} iconColor="#D32F2F" onPress={() => handleDeleteSubscription(subscription._id)} />
								</View>
							</Card.Content>
						</Card>
					);
				})}
			</ScrollView>

			<Portal>
				<Dialog visible={isCreateVisible || isEditVisible} onDismiss={closeDialogs}>
					<Dialog.Title>{editingSubscriptionId ? 'Edit Subscription' : 'Add Subscription'}</Dialog.Title>
					<Dialog.Content>
						<TextInput
							label="Subscription Name"
							mode="outlined"
							value={formState.name}
							onChangeText={(text) => setFormState((current) => ({ ...current, name: text }))}
							style={styles.dialogInput}
						/>
						<TextInput
							label="Amount"
							mode="outlined"
							keyboardType="numeric"
							value={formState.amount}
							onChangeText={(text) => setFormState((current) => ({ ...current, amount: text }))}
							style={styles.dialogInput}
						/>
						<TextInput
							label="Category"
							mode="outlined"
							value={formState.category}
							onChangeText={(text) => setFormState((current) => ({ ...current, category: text }))}
							style={styles.dialogInput}
						/>

						<Text style={styles.dialogSectionLabel}>Billing Cycle</Text>
						<View style={styles.cycleRow}>{cycleOrder.map(renderBillingCycleButton)}</View>

						<Button
							mode="outlined"
							icon="calendar"
							onPress={() => setShowDatePicker(true)}
							style={styles.dateButton}
						>
							{formState.startDate ? `Start Date: ${formState.startDate}` : 'Select Start Date'}
						</Button>

						{showDatePicker ? (
							<DateTimePicker
								value={formDateValue || new Date()}
								mode="date"
								display={Platform.OS === 'ios' ? 'spinner' : 'default'}
								onChange={handleDateChange}
							/>
						) : null}
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={closeDialogs}>Cancel</Button>
						<Button loading={submitting} onPress={handleSaveSubscription}>
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
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: 12,
		marginBottom: 16,
		marginTop: 10,
	},
	title: {
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
	primaryButton: {
		borderRadius: 12,
		backgroundColor: '#1a73eb',
	},
	primaryButtonContent: {
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	inlineAddButton: {
		borderRadius: 12,
		backgroundColor: '#1a73eb',
		alignSelf: 'flex-start',
		marginBottom: 16,
	},
	inlineAddButtonContent: {
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	heroCard: {
		borderRadius: 18,
		backgroundColor: '#173a72',
		marginBottom: 14,
	},
	heroLabel: {
		color: '#dce8ff',
		fontSize: 14,
	},
	heroAmount: {
		color: '#ffffff',
		fontSize: 32,
		fontWeight: 'bold',
		marginTop: 6,
	},
	heroProgress: {
		height: 8,
		borderRadius: 8,
		marginTop: 16,
		backgroundColor: 'rgba(255,255,255,0.18)',
	},
	heroFooterRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 14,
		gap: 12,
	},
	heroFooterText: {
		color: '#dce8ff',
		flex: 1,
		fontSize: 12,
	},
	summaryRow: {
		flexDirection: 'row',
		gap: 10,
		marginBottom: 16,
	},
	summaryCard: {
		flex: 1,
		borderRadius: 14,
		backgroundColor: '#ffffff',
	},
	summaryLabel: {
		fontSize: 12,
		color: '#6B7280',
	},
	summaryValue: {
		fontSize: 12,
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
	subscriptionCard: {
		borderRadius: 16,
		backgroundColor: '#ffffff',
		marginBottom: 12,
	},
	lastCard: {
		marginBottom: 8,
	},
	cardTopRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: 12,
	},
	cardTitleWrap: {
		flex: 1,
	},
	cardTitle: {
		fontSize: 17,
		fontWeight: '700',
		color: '#111827',
	},
	cardSubtitle: {
		fontSize: 13,
		color: '#6B7280',
		marginTop: 4,
	},
	cardAmount: {
		fontSize: 18,
		fontWeight: '700',
		color: '#1a73eb',
	},
	chipRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 12,
		marginBottom: 10,
	},
	pillChip: {
		backgroundColor: '#dbeafe',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
	},
	pillChipText: {
		color: '#1d4ed8',
		fontSize: 12,
		fontWeight: '700',
		textTransform: 'capitalize',
	},
	pillChipSoft: {
		backgroundColor: '#f3f4f6',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
	},
	pillChipSoftText: {
		color: '#374151',
		fontSize: 12,
	},
	progressRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	progressLabel: {
		fontSize: 12,
		color: '#6B7280',
	},
	progressValue: {
		fontSize: 13,
		fontWeight: '700',
		color: '#111827',
	},
	cardProgress: {
		height: 7,
		borderRadius: 999,
		marginTop: 8,
		backgroundColor: '#e5e7eb',
	},
	actionsRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginTop: 6,
	},
	dialogInput: {
		marginBottom: 10,
	},
	dialogSectionLabel: {
		fontSize: 13,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 8,
	},
	cycleRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 12,
	},
	cycleButton: {
		borderRadius: 999,
	},
	cycleButtonContent: {
		paddingHorizontal: 6,
	},
	dateButton: {
		borderRadius: 10,
	},
});

export default SubscriptionScreen;
