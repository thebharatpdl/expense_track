import { colors } from '@/src/theme/colors'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

export const EmptyState = () => (
  <View style={styles.container}>
    <Text style={styles.emoji}>💸</Text>
    <Text style={styles.title}>No expenses yet</Text>
    <Text style={styles.sub}>Tap + to add your first expense</Text>
  </View>
)

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 80,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
  },
  sub: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 4,
  },
})