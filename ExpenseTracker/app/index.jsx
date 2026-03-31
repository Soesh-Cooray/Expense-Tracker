import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';

const SplashScreen = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        router.replace('/intro');
      }, 1000);
    });
  }, [fadeAnim, router]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.brandContainer, { opacity: fadeAnim }]}>
        <View style={styles.logoPlaceholder}>
            <Text style={styles.logoMark}>S</Text>
        </View>
        <Text style={styles.title}>SMART</Text>
        <Text style={styles.subtitle}>EXPENSE TRACKER</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoMark: {
    fontSize: 100,
    fontWeight: 'bold',
    color: '#229954',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1A5276',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#229954',
    marginTop: 4,
    letterSpacing: 1.5,
  },
});

export default SplashScreen;