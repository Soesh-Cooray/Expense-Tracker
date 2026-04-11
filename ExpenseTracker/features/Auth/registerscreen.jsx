import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    if (!name.trim() || !username.trim() || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

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
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
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
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={text => setName(text)}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Email"
            value={username}
            onChangeText={text => setUsername(text)}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={text => setPassword(text)}
            mode="outlined"
            secureTextEntry={secureText}
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon 
                icon={secureText ? "eye" : "eye-off"} 
                onPress={() => setSecureText(!secureText)} 
              />
            }
          />

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={text => setConfirmPassword(text)}
            mode="outlined"
            secureTextEntry={secureText}
            style={styles.input}
            left={<TextInput.Icon icon="lock-check" />}
          />

          <Button 
            mode="contained" 
            onPress={handleRegister} 
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
  input: { marginBottom: 12 },
  button: { marginTop: 10, borderRadius: 8 },
  buttonContent: { paddingVertical: 8 },
  flatButton: { marginTop: 15 },
});

export default RegisterScreen;