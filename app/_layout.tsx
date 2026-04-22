import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}