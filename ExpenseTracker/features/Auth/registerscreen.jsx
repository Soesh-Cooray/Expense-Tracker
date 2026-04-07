import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  const handleRegister = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // This will connect to your Node.js Registration API [cite: 34]
    console.log("Registering:", name, username);
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