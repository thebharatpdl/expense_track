import { EmptyState } from '@/components/EmptyState'
import { ExpenseCard } from '@/components/ExpenseCard'
import { useBudgetStore } from '@/src/store/budgetStore'
import { useExpenseStore } from '@/src/store/expenseStore'
import { colors } from '@/src/theme/colors'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HomeScreen() {
  const { expenses, deleteExpense } = useExpenseStore()
  const { monthlyLimit } = useBudgetStore()
  const [searchQuery, setSearchQuery] = useState('')

  const now = new Date()
  const monthly = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const total = monthly.reduce((sum, e) => sum + e.amount, 0)
  const remaining = monthlyLimit - total
  const percentage = monthlyLimit > 0 ? Math.min((total / monthlyLimit) * 100, 100) : 0

  const displayedExpenses = searchQuery.trim()
    ? expenses.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
    : expenses

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getBudgetColor = () => {
    if (percentage >= 100) return '#EF4444'
    if (percentage >= 80) return '#F59E0B'
    return '#10B981'
  }

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to remove this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={displayedExpenses}
        keyExtractor={(e) => e.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* ── Header ── */}
            <LinearGradient
              colors={['#7C6FFF', '#4A44B5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              {/* Top row */}
              <View style={styles.greetingRow}>
                <View>
                  <Text style={styles.greetingSmall}>
                    {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </Text>
                  <Text style={styles.greeting}>👋 {getGreeting()}</Text>
                </View>
                <TouchableOpacity
                  style={styles.budgetBtn}
                  onPress={() => router.push('/budgetsettings' as any)}
                >
                  <Text style={styles.budgetBtnIcon}>⚙️</Text>
                  <Text style={styles.budgetBtnText}>Budget</Text>
                </TouchableOpacity>
              </View>

              {/* Total amount */}
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total spent this month</Text>
                <Text style={styles.totalAmount}>₹ {total.toLocaleString()}</Text>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{monthly.length}</Text>
                  <Text style={styles.statLabel}>Transactions</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    ₹{monthly.length > 0
                      ? Math.round(total / monthly.length).toLocaleString()
                      : '0'}
                  </Text>
                  <Text style={styles.statLabel}>Avg / expense</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <Text style={[
                    styles.statValue,
                    { color: remaining < 0 ? '#FECACA' : '#86EFAC' },
                  ]}>
                    ₹{Math.abs(remaining).toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>
                    {remaining >= 0 ? 'Remaining' : 'Over budget'}
                  </Text>
                </View>
              </View>

              {/* Budget Progress */}
              {monthlyLimit > 0 ? (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <View style={styles.progressLabelRow}>
                      <View style={[styles.progressDot, { backgroundColor: getBudgetColor() }]} />
                      <Text style={styles.progressLabel}>
                        ₹{total.toLocaleString()} of ₹{monthlyLimit.toLocaleString()}
                      </Text>
                    </View>
                    <Text style={[styles.progressPct, { color: getBudgetColor() }]}>
                      {percentage.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, {
                      width: `${percentage}%`,
                      backgroundColor: getBudgetColor(),
                    }]} />
                  </View>
                  <Text style={styles.progressSub}>
                    {remaining >= 0
                      ? `₹${remaining.toLocaleString()} left to spend`
                      : `₹${Math.abs(remaining).toLocaleString()} over limit`}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.noBudgetBanner}
                  onPress={() => router.push('/budgetsettings' as any)}
                >
                  <Text style={styles.noBudgetIcon}>💡</Text>
                  <View>
                    <Text style={styles.noBudgetTitle}>No budget set</Text>
                    <Text style={styles.noBudgetSub}>Tap here to set your monthly limit</Text>
                  </View>
                  <Text style={styles.noBudgetArrow}>›</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>

            {/* ── Search Bar ── */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or category..."
                placeholderTextColor={colors.subtext + '99'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearBtnWrap}
                >
                  <Text style={styles.clearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Section Header ── */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>
                {searchQuery ? 'SEARCH RESULTS' : 'RECENT TRANSACTIONS'}
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{displayedExpenses.length} items</Text>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ExpenseCard
              expense={item}
              onPress={() => router.push({
                pathname: '/editexpense' as any,
                params: { expense: JSON.stringify(item) },
              })}
              onDelete={() => confirmDelete(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={<EmptyState />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  listContent: {
    paddingBottom: 110,
  },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingSmall: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  greeting: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  budgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  budgetBtnIcon: { fontSize: 14 },
  budgetBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Total ──
  totalSection: {
    marginBottom: 20,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  totalAmount: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 3,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 10,
    borderRadius: 1,
  },

  // ── Progress ──
  progressSection: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  progressPct: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 10,
    borderRadius: 99,
  },
  progressSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '500',
  },

  // ── No Budget ──
  noBudgetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  noBudgetIcon: { fontSize: 22 },
  noBudgetTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  noBudgetSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 1,
  },
  noBudgetArrow: {
    color: '#fff',
    fontSize: 22,
    marginLeft: 'auto',
    opacity: 0.7,
  },

  // ── Search ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  clearBtnWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    fontSize: 11,
    color: colors.subtext,
    fontWeight: '700',
  },

  // ── Section Header ──
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    color: colors.subtext,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  countBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },

  // ── Cards ──
  cardWrapper: {
    paddingHorizontal: 16,
  },
})