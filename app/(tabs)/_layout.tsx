// app/_layout.tsx
import { auth } from '@/src/config/firebase';
import { store, } from '@/src/store';
import { useAppSelector } from '@/src/store/hooks';
import { clearUser, setLoading, setUser } from '@/src/store/slice/authSlice';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Provider, useDispatch } from 'react-redux';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Auth wrapper component to handle navigation
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Listen to Firebase auth state
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
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();

  return (
    <AuthWrapper>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* Auth Screens - No Header */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />

          {/* Main Tabs - Home screen with expenses and groups */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Modal Screen */}
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: false }} />

          {/* Budget Settings Screen */}
          <Stack.Screen
            name="budgetsettings"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />

          {/* Edit Expense Screen */}
          <Stack.Screen
            name="editexpense"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />

          {/* Add Expense Screen */}
          <Stack.Screen
            name="add-expense"
            options={{
              headerShown: false,
              presentation: 'card',        
            }}
          />

          {/* Group Creation Screen */}
          <Stack.Screen
            name="Group_creation"
            options={{
              headerShown: false,
              presentation: 'card',           
            }}
          />

          {/* Group Expense Screen */}
          <Stack.Screen
            name="Group_expense"
            options={{
              headerShown: false,
              presentation: 'card',           
            }}
          />

          {/* Join Group Screen */}
          <Stack.Screen
            name="join-group"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />

          {/* All Expenses Screen */}
          <Stack.Screen
            name="all-expenses"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthWrapper>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutContent />
      </GestureHandlerRootView>
    </Provider>
  );
}