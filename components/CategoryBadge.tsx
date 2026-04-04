import { colors } from '@/src/theme/colors'
import { Category } from '@/src/types'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const icons: Record<Category, string> = {
  Food: '🍔',
  Transport: '🚌',
  Shopping: '🛒',
  Bills: '💡',
  Health: '💊',
  Other: '📦',
}

export const CategoryBadge = ({ category }: { category: Category }) => (
  <View style={[styles.badge, { backgroundColor: colors.categoryColors[category] }]}>
    <Text style={styles.icon}>{icons[category]}</Text>
  </View>
)

const styles = StyleSheet.create({
  badge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
})