// app/_layout.tsx
import { auth } from '@/src/config/firebase';
import { store } from '@/src/store';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { clearUser, setLoading, setUser } from '@/src/store/slices/authSlice';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import 'react-native-reanimated';
import { Provider } from 'react-redux';

import { useColorScheme } from '@/hooks/use-color-scheme';

// 👇 SET THIS TO true TO BYPASS LOGIN, false FOR REAL LOGIN
const SKIP_LOGIN = true;

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Auth wrapper component
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Skip Firebase auth check in dev mode
    if (SKIP_LOGIN) {
      dispatch(setLoading(false));
      return;
    }
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        dispatch(setUser(user));
      } else {
        dispatch(clearUser());
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    // Skip navigation redirect in dev mode
    if (SKIP_LOGIN) return;
    
    // Only navigate after the root layout is mounted
    if (!navigationState?.key) return;
    
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, navigationState?.key]);

  if (loading && !SKIP_LOGIN) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  return <>{children}</>;
}

// Main layout content
function RootLayoutContent() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Auth Screens */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />

        {/* Main Tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Other Screens */}
        <Stack.Screen name="add-expense" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="Group_creation" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="Group_expense" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="join-group" options={{ headerShown: false, presentation: 'card' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

// Root layout with Redux Provider
export default function RootLayout() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthWrapper>
          <RootLayoutContent />
        </AuthWrapper>
      </GestureHandlerRootView>
    </Provider>
  );
}