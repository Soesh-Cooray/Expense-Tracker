import React, { useState } from 'react';
import useAuthStore from '../../store/Authstore';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const LoginScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const login = useAuthStore((state) => state.login);

  // Simple validation check for the UI
  const hasUsernameError = () => {
    return username.length > 0 && !username.includes('@');
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (hasUsernameError()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!API_BASE_URL) {
      Alert.alert('Configuration error', 'API base URL is missing. Check your .env file.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Login failed', data.message || data.error || 'Please try again');
        return;
      }

      await login(data.user, data.token);
      Alert.alert('Success', 'Login successful');
      router.push('/dashboard');
    } catch (error) {
      Alert.alert('Network error', error?.message || 'Could not reach the server');
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

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Enter Your Email and Password to continue</Text>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={username}
            onChangeText={text => setUsername(text)}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />
          <HelperText type="error" visible={hasUsernameError()}>
            Invalid email address
          </HelperText>

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

          <Button 
            mode="contained" 
            onPress={handleLogin} 
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor='#1a73eb'
          >
            Login
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/resetpassword')}
            style={styles.linkButton}
            textColor='#1a73eb'
          >
            Forgot Password?
          </Button>

          <Button mode="text" onPress={() => router.push('/register')} style={styles.flatButton} textColor='#000000'>
            Don't have an account? Sign Up
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
  linkButton: {
    marginTop: 10,
  },
});

export default LoginScreen;