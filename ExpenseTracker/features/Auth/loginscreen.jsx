import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  // Simple validation check for the UI
  const hasEmailError = () => {
    return email.length > 0 && !email.includes('@');
  };

  const handleLogin = () => {
    // Logic to connect to your Node.js + Express backend goes here
    console.log("Logging in with:", email, password);
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
            value={email}
            onChangeText={text => setEmail(text)}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />
          <HelperText type="error" visible={hasEmailError()}>
            Email address is invalid!
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
});

export default LoginScreen;