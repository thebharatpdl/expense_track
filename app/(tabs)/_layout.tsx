import { Tabs } from 'expo-router'
import React from 'react'
import 'react-native-get-random-values'; // required for uuid globally

import { HapticTab } from '@/components/haptic-tab'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* Add Expense */}
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="plus.circle.fill" color={color} />
          ),
        }}
      />

      {/* Summary */}
      <Tabs.Screen
        name="summary"
        options={{
          title: 'Summary',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.pie.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  )
}