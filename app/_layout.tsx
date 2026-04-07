import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '@/src/theme/colors';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="budgetsettings"
          options={{
            title: 'Budget Settings',
            headerTintColor: colors.primary,
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: colors.card },
          }}
        />
        <Stack.Screen
          name="editexpense"
          options={{
            title: 'Edit Expense',
            headerTintColor: colors.primary,
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: colors.card },
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}