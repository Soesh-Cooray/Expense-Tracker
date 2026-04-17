import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const ResetPasswordConfirmScreen = () => {
	const router = useRouter();
	const params = useLocalSearchParams();
	const email = useMemo(() => String(params.email || ''), [params.email]);
	const otp = useMemo(() => String(params.otp || ''), [params.otp]);

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [secureText, setSecureText] = useState(true);
	const [loading, setLoading] = useState(false);

	const handleResetPassword = async () => {
		if (!email || !otp) {
			Alert.alert('Error', 'Missing email or OTP. Please try again.');
			router.push('/resetpassword');
			return;
		}

		if (!password || !confirmPassword) {
			Alert.alert('Error', 'Please fill in all fields');
			return;
		}

		if (password.length < 6) {
			Alert.alert('Error', 'Password must be at least 6 characters');
			return;
		}

		if (password !== confirmPassword) {
			Alert.alert('Error', 'Passwords do not match');
			return;
		}

		if (!API_BASE_URL) {
			Alert.alert('Configuration error', 'API base URL is missing. Check your .env file.');
			return;
		}

		try {
			setLoading(true);

			const response = await fetch(`${API_BASE_URL}/users/reset-password/confirm`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					otp,
					password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				Alert.alert('Reset failed', data.message || data.error || 'Please try again');
				return;
			}

			Alert.alert('Success', data.message || 'Password reset successfully');
			router.push('/login');
		} catch (error) {
			Alert.alert('Network error', 'Could not reach the server');
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
		>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.logoContainer}>
					<Image
						source={require('../../assets/images/Smart Expense Logo.png')}
						style={styles.logo}
						resizeMode="contain"
					/>
				</View>

				<Text style={styles.title}>Set New Password</Text>
				<Text style={styles.subtitle}>Create a new password for {email || 'your account'}</Text>

				<View style={styles.form}>
					<TextInput
						label="New Password"
						value={password}
						onChangeText={text => setPassword(text)}
						mode="outlined"
						secureTextEntry={secureText}
						style={styles.input}
						left={<TextInput.Icon icon="lock" />}
						right={
							<TextInput.Icon
								icon={secureText ? 'eye' : 'eye-off'}
								onPress={() => setSecureText(!secureText)}
							/>
						}
					/>

					<TextInput
						label="Confirm New Password"
						value={confirmPassword}
						onChangeText={text => setConfirmPassword(text)}
						mode="outlined"
						secureTextEntry={secureText}
						style={styles.input}
						left={<TextInput.Icon icon="lock-check" />}
					/>

					<Button
						mode="contained"
						onPress={handleResetPassword}
						style={styles.button}
						contentStyle={styles.buttonContent}
						buttonColor="#1a73eb"
						loading={loading}
						disabled={loading}
					>
						Update Password
					</Button>

					<Button mode="text" onPress={() => router.push('/login')} style={styles.flatButton} textColor="#000000">
						Back to Login
					</Button>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	scrollContent: {
		padding: 20,
		flexGrow: 1,
		justifyContent: 'center',
	},
	logoContainer: {
		alignItems: 'center',
		marginBottom: 30,
	},
	logo: {
		width: 120,
		height: 120,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		textAlign: 'center',
		color: '#1a1a1a',
	},
	subtitle: {
		fontSize: 16,
		textAlign: 'center',
		color: '#666',
		marginBottom: 30,
		marginTop: 8,
	},
	form: {
		width: '100%',
	},
	input: {
		marginBottom: 12,
	},
	button: {
		marginTop: 10,
		borderRadius: 8,
	},
	buttonContent: {
		paddingVertical: 8,
	},
	flatButton: {
		marginTop: 15,
	},
});

export default ResetPasswordConfirmScreen;
