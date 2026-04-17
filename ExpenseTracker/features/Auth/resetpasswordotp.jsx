import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

const ResetPasswordOtpScreen = () => {
	const router = useRouter();
	const params = useLocalSearchParams();
	const email = useMemo(() => String(params.email || ''), [params.email]);
	const [otp, setOtp] = useState('');

	const otpError = otp.length > 0 && !/^\d{6}$/.test(otp);

	const handleContinue = () => {
		if (!email) {
			Alert.alert('Error', 'Missing email. Please request OTP again.');
			router.push('/resetpassword');
			return;
		}

		if (!/^\d{6}$/.test(otp)) {
			Alert.alert('Error', 'Enter the 6-digit OTP sent to your email');
			return;
		}

		router.push({ pathname: '/resetpasswordconfirm', params: { email, otp } });
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

				<Text style={styles.title}>Enter OTP</Text>
				<Text style={styles.subtitle}>Enter the 6-digit code sent to {email || 'your email'}</Text>

				<View style={styles.form}>
					<TextInput
						label="6-digit OTP"
						value={otp}
						onChangeText={text => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
						mode="outlined"
						keyboardType="number-pad"
						style={styles.input}
						left={<TextInput.Icon icon="shield-key" />}
					/>

					<HelperText type="error" visible={otpError}>
						OTP must be exactly 6 digits
					</HelperText>

					<Button
						mode="contained"
						onPress={handleContinue}
						style={styles.button}
						contentStyle={styles.buttonContent}
						buttonColor="#1a73eb"
					>
						Verify OTP
					</Button>

					<Button mode="text" onPress={() => router.push('/resetpassword')} style={styles.flatButton} textColor="#000000">
						Use a Different Email
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

export default ResetPasswordOtpScreen;
