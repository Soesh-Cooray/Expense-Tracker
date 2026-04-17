import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const ResetPasswordScreen = () => {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);

	const hasEmailError = () => email.length > 0 && !email.includes('@');

	const handleSendOtp = async () => {
		if (!email.trim()) {
			Alert.alert('Error', 'Please enter your email');
			return;
		}

		if (hasEmailError()) {
			Alert.alert('Error', 'Please enter a valid email address');
			return;
		}

		if (!API_BASE_URL) {
			Alert.alert('Configuration error', 'API base URL is missing. Check your .env file.');
			return;
		}

		try {
			setLoading(true);

			const normalizedEmail = email.trim().toLowerCase();
			const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: normalizedEmail }),
			});

			const data = await response.json();

			if (!response.ok) {
				Alert.alert('Request failed', data.message || data.error || 'Please try again');
				return;
			}

			Alert.alert('OTP Sent', data.message || 'Check your email for the OTP code');
			router.push({ pathname: '/resetpasswordotp', params: { email: normalizedEmail } });
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

				<Text style={styles.title}>Reset Password</Text>
				<Text style={styles.subtitle}>Enter your email to receive a 6-digit OTP</Text>

				<View style={styles.form}>
					<TextInput
						label="Email"
						value={email}
						onChangeText={text => setEmail(text)}
						mode="outlined"
						keyboardType="email-address"
						autoCapitalize="none"
						style={styles.input}
						left={<TextInput.Icon icon="email" />}
					/>

					<HelperText type="error" visible={hasEmailError()}>
						Invalid email address
					</HelperText>

					<Button
						mode="contained"
						onPress={handleSendOtp}
						style={styles.button}
						contentStyle={styles.buttonContent}
						buttonColor="#1a73eb"
						loading={loading}
						disabled={loading}
					>
						Send OTP
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
		marginBottom: 4,
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

export default ResetPasswordScreen;
