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
    year: 'numeric'
  })

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      onLongPress={onDelete}
      activeOpacity={0.7}
    >
      <View style={styles.categoryContainer}>
        <CategoryBadge category={expense.category} />
      </View>
      
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {expense.title}
        </Text>
        <View style={styles.metaContainer}>
          <Text style={styles.meta}>{expense.category}</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{formattedDate}</Text>
        </View>
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>-₹{expense.amount.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryContainer: {
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    color: colors.subtext,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.subtext,
    marginHorizontal: 6,
    opacity: 0.5,
  },
  amountContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.expense,
  },
})