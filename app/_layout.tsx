// app/_layout.tsx
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/src/config/firebase';
import { store } from '@/src/store';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { clearUser, setLoading, setUser } from '@/src/store/slices/authSlice';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
// 👇 SET TO false FOR REAL LOGIN
const SKIP_LOGIN = false;

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Auth wrapper component
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, emailVerified } = useAppSelector(state => state.auth);
  const navigationState = useRootNavigationState();
  const segments = useSegments();

  useEffect(() => {
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
    if (SKIP_LOGIN) return;
    
    if (!navigationState?.key) return;
    
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'verify-email';
    
    if (!loading && !isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (!loading && isAuthenticated && !emailVerified && segments[0] !== 'verify-email') {
      router.replace('/verify-email');
    } else if (!loading && isAuthenticated && emailVerified && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading, emailVerified, navigationState?.key, segments]);

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
  const { isAuthenticated, loading, emailVerified } = useAppSelector(state => state.auth);

  if (loading && !SKIP_LOGIN) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1D9E75" />
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth screens - only shown when not authenticated */}
        {!isAuthenticated && (
          <>
            <Stack.Screen 
              name="login" 
              options={{ 
                headerShown: false,
                gestureEnabled: false 
              }} 
            />
            <Stack.Screen 
              name="register" 
              options={{ 
                headerShown: false,
                gestureEnabled: false 
              }} 
            />
          </>
        )}
        
        {/* Email verification screen - shown when authenticated but not verified */}
        {isAuthenticated && !emailVerified && (
          <Stack.Screen 
            name="verify-email" 
            options={{ 
              headerShown: false,
              gestureEnabled: false 
            }} 
          />
        )}
        
        {/* Tabs and other screens - only shown when authenticated and verified */}
        {isAuthenticated && emailVerified && (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="add-expense" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="Group_creation" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="Group_expense" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="join-group" options={{ headerShown: false, presentation: 'card' }} />
          </>
        )}
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