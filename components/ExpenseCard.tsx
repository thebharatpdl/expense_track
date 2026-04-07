import { colors } from '@/src/theme/colors'
import { Expense } from '@/src/types'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { CategoryBadge } from './CategoryBadge'

interface Props {
  expense: Expense
  onPress: () => void
  onDelete: () => void
}

export const ExpenseCard = ({ expense, onPress, onDelete }: Props) => {
  const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onDelete}
      activeOpacity={0.75}
    >
      <CategoryBadge category={expense.category} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
        {expense.description ? (
          <Text style={styles.description} numberOfLines={1}>{expense.description}</Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{expense.category}</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{formattedDate}</Text>
        </View>
      </View>
      <View style={styles.amountBadge}>
        <Text style={styles.amount}>-₹{expense.amount.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    gap: 12,
  },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  description: { fontSize: 12, color: colors.subtext, marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: 12, color: colors.subtext },
  dot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: colors.subtext, marginHorizontal: 5, opacity: 0.4,
  },
  amountBadge: {
    backgroundColor: 'rgba(231,76,60,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  amount: { fontSize: 14, fontWeight: '600', color: colors.expense },
})