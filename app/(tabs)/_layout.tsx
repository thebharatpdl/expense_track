// app/(tabs)/_layout.tsx
import { HapticTab } from '@/components/haptic-tab'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Ionicons } from '@expo/vector-icons'
import { Tabs, useSegments } from 'expo-router'
import React from 'react'

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const tint = Colors[colorScheme ?? 'light'].tint
  const segments = useSegments()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1E1E2E' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#2E2E3E' : '#F1F5F9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          // Add this to hide tab bar when on auth screens
          display: segments[0] === '(tabs)' ? 'flex' : 'none',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="summary"
        options={{
          title: 'Summary',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}