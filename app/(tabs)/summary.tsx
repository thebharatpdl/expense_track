import { useBudgetStore } from '@/src/store/budgetStore'
import { useExpenseStore } from '@/src/store/expenseStore'
import { colors } from '@/src/theme/colors'
import { Category } from '@/src/types'
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

const catColors: Record<Category, string> = {
  Food: '#6C63FF', Transport: '#378ADD', Shopping: '#2ECC71',
  Bills: '#F39C12', Health: '#E74C3C', Other: '#888780',
}

const SummaryScreen = () => {
  const { getMonthlyExpenses } = useExpenseStore()
  const { monthlyLimit } = useBudgetStore()
  const expenses = getMonthlyExpenses()
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const budgetPercent = Math.min((total / monthlyLimit) * 100, 100)
  const budgetColor = budgetPercent < 60
    ? colors.income
    : budgetPercent < 85
    ? colors.warning
    : colors.expense

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>Spending overview</Text>
        <Text style={styles.headerMonth}>
          {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionLabel}>BUDGET</Text>
        <View style={styles.card}>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetText}>Spent: Rs.{total.toLocaleString()}</Text>
            <Text style={styles.budgetText}>Limit: Rs.{monthlyLimit.toLocaleString()}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${budgetPercent}%`, backgroundColor: budgetColor }]} />
          </View>
          <Text style={[styles.budgetHint, { color: budgetColor }]}>
            {budgetPercent.toFixed(0)}% used
          </Text>
        </View>

        <Text style={styles.sectionLabel}>BY CATEGORY</Text>
        <View style={styles.card}>
          {Object.entries(byCategory).map(([cat, amt]) => {
            const pct = total > 0 ? (amt / total) * 100 : 0
            return (
              <View key={cat} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: catColors[cat as Category] }]} />
                <Text style={styles.catName}>{cat}</Text>
                <View style={styles.catBarTrack}>
                  <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: catColors[cat as Category] }]} />
                </View>
                <Text style={styles.catAmt}>Rs.{amt.toLocaleString()}</Text>
              </View>
            )
          })}
          {Object.keys(byCategory).length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>

        <Text style={styles.sectionLabel}>TOTAL THIS MONTH</Text>
        <View style={[styles.card, styles.totalCard]}>
          <Text style={styles.totalLabel}>Total spent</Text>
          <Text style={styles.totalAmount}>Rs. {total.toLocaleString()}</Text>
        </View>
      </View>
    </ScrollView>
  )
}

export default SummaryScreen

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, padding: 20, paddingTop: 50 },
  headerSub: { color: '#ffffff99', fontSize: 13 },
  headerMonth: { color: '#fff', fontSize: 18, fontWeight: '500', marginTop: 4 },
  body: { padding: 16 },
  sectionLabel: { fontSize: 11, color: colors.subtext, fontWeight: '500', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: colors.border },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetText: { fontSize: 12, color: colors.subtext },
  track: { backgroundColor: '#eee', borderRadius: 99, height: 10, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 99 },
  budgetHint: { fontSize: 11, marginTop: 6, textAlign: 'right' },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  catName: { fontSize: 13, color: colors.text, width: 70 },
  catBarTrack: { flex: 1, backgroundColor: '#eee', borderRadius: 99, height: 6, overflow: 'hidden', marginHorizontal: 8 },
  catBarFill: { height: 6, borderRadius: 99 },
  catAmt: { fontSize: 12, color: colors.subtext, width: 70, textAlign: 'right' },
  emptyText: { color: colors.subtext, fontSize: 13, textAlign: 'center', padding: 10 },
  totalCard: { alignItems: 'center', paddingVertical: 20 },
  totalLabel: { fontSize: 13, color: colors.subtext },
  totalAmount: { fontSize: 28, fontWeight: '600', color: colors.primary, marginTop: 4 },
})