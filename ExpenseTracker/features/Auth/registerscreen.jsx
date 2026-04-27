import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Full name is required'),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
      .regex(/[a-z]/, 'Password must include at least one lowercase letter')
      .regex(/[0-9]/, 'Password must include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const RegisterScreen = () => {
  const [secureText, setSecureText] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleRegister = async (values) => {

    if (!API_BASE_URL) {
      Alert.alert('Configuration error', 'API base URL is missing. Check your .env file.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name.trim(),
          username: values.email.trim().toLowerCase(),
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Registration failed', data.message || data.error || 'Please try again');
        return;
      }

      Alert.alert('Success', 'Account created successfully');
      router.push('/login');
    } catch (error) {
      Alert.alert('Network error', 'Could not reach the server');
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
            source={require("../../assets/images/Smart Expense Logo.png")} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Smart Expense to start tracking</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Full Name"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  mode="outlined"
                  style={styles.input}
                  error={Boolean(errors.name)}
                  left={<TextInput.Icon icon="account" />}
                />
                <HelperText type="error" visible={Boolean(errors.name)}>
                  {errors.name?.message}
                </HelperText>
              </>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Email"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  mode="outlined"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  error={Boolean(errors.email)}
                  left={<TextInput.Icon icon="email" />}
                />
                <HelperText type="error" visible={Boolean(errors.email)}>
                  {errors.email?.message}
                </HelperText>
              </>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Password"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  mode="outlined"
                  secureTextEntry={secureText}
                  style={styles.input}
                  error={Boolean(errors.password)}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={secureText ? 'eye' : 'eye-off'}
                      onPress={() => setSecureText(!secureText)}
                    />
                  }
                />
                <HelperText type="error" visible={Boolean(errors.password)}>
                  {errors.password?.message}
                </HelperText>
              </>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Confirm Password"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  mode="outlined"
                  secureTextEntry={secureText}
                  style={styles.input}
                  error={Boolean(errors.confirmPassword)}
                  left={<TextInput.Icon icon="lock-check" />}
                />
                <HelperText type="error" visible={Boolean(errors.confirmPassword)}>
                  {errors.confirmPassword?.message}
                </HelperText>
              </>
            )}
          />

          <Button 
            mode="contained" 
            onPress={handleSubmit(handleRegister)} 
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor='#1a73eb' 
          >
            Register
          </Button>

          <Button mode="text" onPress={() => router.push('/login')} style={styles.flatButton} textColor='#000000'>
            Already have an account? Login
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 100, height: 100 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#1a1a1a' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#666', marginBottom: 20 },
  form: { width: '100%' },
  input: { marginBottom: 2 },
  button: { marginTop: 10, borderRadius: 8 },
  buttonContent: { paddingVertical: 8 },
  flatButton: { marginTop: 15 },
});

export default RegisterScreen;