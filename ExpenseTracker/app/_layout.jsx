import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { useColorScheme } from '../components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'intro',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const paperTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#1a73eb',
      onPrimary: '#ffffff',
      background: '#f5f5f5',
      surface: '#ffffff',
      onSurface: '#111827',
      onSurfaceVariant: '#374151',
      outline: '#d1d5db',
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="intro" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="resetpassword" options={{ headerShown: false }} />
          <Stack.Screen name="resetpasswordotp" options={{ headerShown: false }} />
          <Stack.Screen name="resetpasswordconfirm" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="expense" options={{ headerShown: false }} />
          <Stack.Screen name="income" options={{ headerShown: false }} />
          <Stack.Screen name="savingsGoal" options={{ headerShown: false }} />
          <Stack.Screen name="subscription" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
