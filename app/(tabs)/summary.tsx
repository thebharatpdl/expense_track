// app/summary.tsx
import { Group, GroupExpense, subscribeToGroupExpenses, subscribeToUserGroups } from '@/src/services/groupService'
import { subscribeToUserExpenses, UserExpense } from '@/src/services/userExpenseService'
import { useAppSelector } from '@/src/store/hooks'
import { colors } from '@/src/theme/colors'
import { Category } from '@/src/types'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const catColors: Record<Category, string> = {
  Food: '#F59E0B', 
  Transport: '#3B82F6', 
  Shopping: '#8B5CF6',
  Bills: '#10B981', 
  Health: '#EF4444', 
  Other: '#6B7280',
}

// Combined expense type
type CombinedExpense = {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  type: 'personal' | 'group';
}

const SummaryScreen = () => {
  const { user } = useAppSelector(state => state.auth);
  const { monthlyLimit } = useAppSelector(state => state.budget);
  const [personalExpenses, setPersonalExpenses] = useState<UserExpense[]>([])
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [allExpenses, setAllExpenses] = useState<CombinedExpense[]>([])

  // Load personal expenses
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserExpenses(user.uid, (fetched) => {
      setPersonalExpenses(fetched)
    })
    return () => unsubscribe()
  }, [user])

  // Load groups and their expenses
  useEffect(() => {
    if (!user) return;

    const unsubscribeGroups = subscribeToUserGroups(user.uid, (fetchedGroups) => {
      setGroups(fetchedGroups)
      
      // Subscribe to expenses for each group
      const unsubscribes: (() => void)[] = []
      
      fetchedGroups.forEach(group => {
        const unsubscribeExpenses = subscribeToGroupExpenses(group.id, (expenses) => {
          setGroupExpenses(prev => {
            const otherGroups = prev.filter(e => e.groupId !== group.id)
            return [...otherGroups, ...expenses]
          })
        })
        unsubscribes.push(unsubscribeExpenses)
      })
      
      return () => {
        unsubscribes.forEach(unsub => unsub())
      }
    })

    return () => unsubscribeGroups()
  }, [user])

  // Combine personal and group expenses (only where user paid)
  useEffect(() => {
    const combined: CombinedExpense[] = [
      ...personalExpenses.map(exp => ({
        id: exp.id,
        title: exp.title,
        amount: exp.amount,
        category: exp.category as Category,
        date: exp.date,
        type: 'personal' as const,
      })),
      ...groupExpenses
        .filter(exp => exp.paidBy === user?.uid)
        .map(exp => ({
          id: exp.id,
          title: exp.title,
          amount: exp.amount,
          category: exp.category as Category,
          date: exp.date,
          type: 'group' as const,
        })),
    ]
    
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setAllExpenses(combined)
  }, [personalExpenses, groupExpenses, user])

  const now = new Date()

  // Filter current month expenses
  const expenses = allExpenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const weeklyTotals = [0, 0, 0, 0]
  expenses.forEach(e => {
    const week = Math.min(Math.floor((new Date(e.date).getDate() - 1) / 7), 3)
    weeklyTotals[week] += e.amount
  })

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const maxWeekly = Math.max(...weeklyTotals, 1)
  const budgetPercent = monthlyLimit > 0 ? Math.min((total / monthlyLimit) * 100, 100) : 0
  const budgetColor = budgetPercent < 60 ? '#10B981' : budgetPercent < 85 ? '#F59E0B' : '#EF4444'
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
  const avgExpense = expenses.length > 0 ? total / expenses.length : 0

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Header ── */}
        <LinearGradient
          colors={['#1D9E75', '#16825E', '#0F6648']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerLabel}>OVERVIEW</Text>
          <Text style={styles.headerMonth}>
            {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <Text style={styles.headerTotal}>₹ {total.toLocaleString()}</Text>
          <Text style={styles.headerSub}>total spent this month</Text>
        </LinearGradient>

        {/* ── Quick Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={styles.statVal}>₹{Math.round(avgExpense).toLocaleString()}</Text>
            <Text style={styles.statLbl}>Avg expense</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🧾</Text>
            <Text style={styles.statVal}>{expenses.length}</Text>
            <Text style={styles.statLbl}>This month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statVal} numberOfLines={1}>
              {topCategory ? topCategory[0] : '—'}
            </Text>
            <Text style={styles.statLbl}>Top category</Text>
          </View>
        </View>

        {/* ── Budget ── */}
        <Text style={styles.sectionLabel}>BUDGET USAGE</Text>
        <View style={styles.card}>
          <View style={styles.budgetTopRow}>
            <View>
              <Text style={styles.budgetSmall}>Spent</Text>
              <Text style={styles.budgetBig}>₹{total.toLocaleString()}</Text>
            </View>
            <View style={[styles.budgetPctBadge, { backgroundColor: budgetColor + '18' }]}>
              <Text style={[styles.budgetPctText, { color: budgetColor }]}>
                {budgetPercent.toFixed(0)}%
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.budgetSmall}>Limit</Text>
              <Text style={[styles.budgetBig, { color: colors.subtext }]}>
                ₹{monthlyLimit.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, {
              width: `${budgetPercent}%`,
              backgroundColor: budgetColor,
            }]} />
          </View>
          <Text style={[styles.hint, { color: budgetColor }]}>
            {budgetPercent.toFixed(0)}% used · ₹{(monthlyLimit - total).toLocaleString()} remaining
          </Text>
        </View>

        {/* ── Weekly Chart ── */}
        <Text style={styles.sectionLabel}>WEEKLY SPENDING</Text>
        <View style={styles.card}>
          <View style={styles.barChart}>
            {weeklyTotals.map((val, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barAmt}>
                  {val > 0 ? `₹${Math.round(val / 1000)}k` : ''}
                </Text>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={val > 0
                      ? ['#1D9E75', '#16825E']
                      : ['#E8ECF0', '#E8ECF0']}
                    style={[styles.barFill, {
                      height: `${(val / maxWeekly) * 100}%`,
                      minHeight: val > 0 ? 6 : 0,
                    }]}
                  />
                </View>
                <Text style={[styles.barLabel,
                  i === Math.floor((now.getDate() - 1) / 7) && styles.barLabelActive
                ]}>
                  W{i + 1}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── By Category ── */}
        <Text style={styles.sectionLabel}>BY CATEGORY</Text>
        <View style={styles.card}>
          {Object.entries(byCategory).length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.empty}>No expenses this month</Text>
            </View>
          )}
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amt], index) => {
              const pct = total > 0 ? (amt / total) * 100 : 0
              return (
                <View key={cat} style={[
                  styles.catRow,
                  index < Object.entries(byCategory).length - 1 && styles.catRowBorder,
                ]}>
                  <View style={[styles.catIconBadge, {
                    backgroundColor: catColors[cat as Category] + '18',
                  }]}>
                    <View style={[styles.catDot, {
                      backgroundColor: catColors[cat as Category],
                    }]} />
                  </View>
                  <Text style={styles.catName}>{cat}</Text>
                  <View style={styles.catTrack}>
                    <View style={[styles.catFill, {
                      width: `${pct}%`,
                      backgroundColor: catColors[cat as Category],
                    }]} />
                  </View>
                  <View style={styles.catRight}>
                    <Text style={styles.catAmt}>₹{amt.toLocaleString()}</Text>
                    <Text style={styles.catPct}>{pct.toFixed(0)}%</Text>
                  </View>
                </View>
              )
            })}
        </View>

        {/* ── Total Card ── */}
        <Text style={styles.sectionLabel}>MONTH TOTAL</Text>
        <LinearGradient
          colors={['#1D9E75', '#16825E', '#0F6648']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalCard}
        >
          <Text style={styles.totalLbl}>
            Total spent in {now.toLocaleString('default', { month: 'long' })}
          </Text>
          <Text style={styles.totalAmt}>₹ {total.toLocaleString()}</Text>
          {topCategory && (
            <View style={styles.topCatChip}>
              <Text style={styles.topCatText}>
                🏆 Most spent on {topCategory[0]} — ₹{topCategory[1].toLocaleString()}
              </Text>
            </View>
          )}
        </LinearGradient>

      </ScrollView>
    </SafeAreaView>
  )
}

export default SummaryScreen

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { paddingBottom: 110 },

  // ── Header ──
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 20,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  headerMonth: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerTotal: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#1D9E75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statEmoji: { fontSize: 20, marginBottom: 6 },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D9E75',
    marginBottom: 3,
  },
  statLbl: {
    fontSize: 10,
    color: colors.subtext,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // ── Section Label ──
  sectionLabel: {
    fontSize: 11,
    color: colors.subtext,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 20,
    paddingHorizontal: 16,
  },

  // ── Card ──
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    marginHorizontal: 16,
    shadowColor: '#1D9E75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  // ── Budget ──
  budgetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  budgetSmall: { fontSize: 12, color: colors.subtext, marginBottom: 2 },
  budgetBig: { fontSize: 22, fontWeight: '800', color: colors.text },
  budgetPctBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  budgetPctText: { fontSize: 18, fontWeight: '800' },
  track: {
    backgroundColor: '#F1F5F9',
    borderRadius: 99,
    height: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fill: { height: 12, borderRadius: 99 },
  hint: { fontSize: 12, textAlign: 'right', fontWeight: '600' },

  // ── Bar Chart ──
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 130,
    gap: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barAmt: {
    fontSize: 9,
    color: '#1D9E75',
    marginBottom: 4,
    fontWeight: '700',
  },
  barTrack: {
    width: '100%',
    height: 90,
    justifyContent: 'flex-end',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  barFill: {
    width: '100%',
    borderRadius: 10,
  },
  barLabel: {
    fontSize: 11,
    color: colors.subtext,
    marginTop: 6,
    fontWeight: '600',
  },
  barLabelActive: {
    color: '#1D9E75',
    fontWeight: '800',
  },

  // ── Category ──
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  catRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  catIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catName: {
    fontSize: 13,
    color: colors.text,
    width: 72,
    fontWeight: '600',
  },
  catTrack: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 99,
    height: 8,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  catFill: { height: 8, borderRadius: 99 },
  catRight: { width: 68, alignItems: 'flex-end' },
  catAmt: { fontSize: 13, color: colors.text, fontWeight: '700' },
  catPct: { fontSize: 10, color: colors.subtext, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingVertical: 20 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  empty: { color: colors.subtext, fontSize: 14, fontWeight: '500' },

  // ── Total Card ──
  totalCard: {
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1D9E75',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  totalLbl: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginBottom: 8,
  },
  totalAmt: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 14,
  },
  topCatChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  topCatText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
})