import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

const IntroScreen = () => {
  // Initialize the Expo Router for navigation
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Half: Branding & Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/Smart Expense Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>SMART</Text>
        <Text style={styles.subtitle}>EXPENSE TRACKER</Text>
      </View>

      {/* Bottom Half: Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/login')} 
        >
          <Text style={styles.primaryButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/register')} 
        >
          <Text style={styles.secondaryButtonText}>Create an Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// 🎨 Styles & Theming
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Clean off-white background
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#1A5276', // Deep Navy Blue
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#229954', // Emerald Green
    letterSpacing: 2,
    marginTop: 5,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#229954', // Emerald Green
    paddingVertical: 16,
    width: '70%',
    borderRadius: 40,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
    elevation: 3, // Subtle drop shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    width: '70%',
    borderRadius: 40,
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#1A5276', // Deep Navy Blue
  },
  secondaryButtonText: {
    color: '#1A5276',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default IntroScreen;