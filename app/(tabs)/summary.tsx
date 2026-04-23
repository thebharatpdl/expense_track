// app/summary.tsx
import { Group, GroupExpense, subscribeToGroupExpenses, subscribeToUserGroups } from '@/src/services/groupService'
import { subscribeToUserExpenses, UserExpense } from '@/src/services/userExpenseService'
import { useAppSelector } from '@/src/store/hooks'
import { Category } from '@/src/types'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width: screenWidth } = Dimensions.get('window')

const catColors: Record<Category, string> = {
  Food: '#F59E0B', 
  Transport: '#3B82F6', 
  Shopping: '#8B5CF6',
  Bills: '#10B981', 
  Health: '#EF4444', 
  Other: '#6B7280',
}

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

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserExpenses(user.uid, setPersonalExpenses)
    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user) return;
    const unsubscribeGroups = subscribeToUserGroups(user.uid, (fetchedGroups) => {
      setGroups(fetchedGroups)
      const unsubscribes = fetchedGroups.map(group =>
        subscribeToGroupExpenses(group.id, (expenses) => {
          setGroupExpenses(prev => {
            const other = prev.filter(e => e.groupId !== group.id)
            return [...other, ...expenses]
          })
        })
      )
      return () => unsubscribes.forEach(unsub => unsub())
    })
    return () => unsubscribeGroups()
  }, [user])

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
      <StatusBar style="light" backgroundColor="#1D9E75" translucent={false} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header with large total */}
        <LinearGradient
          colors={['#1D9E75', '#16825E', '#0F6648']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerMonth}>
            {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <Text style={styles.headerTotal}>₹ {total.toLocaleString()}</Text>
          <Text style={styles.headerSub}>total spent</Text>
        </LinearGradient>

        {/* Three stat cards blended with gradient */}
        <View style={styles.statsRow}>
          <LinearGradient colors={['#fff', '#F8FAFC']} style={styles.statCard}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={styles.statVal}>₹{Math.round(avgExpense).toLocaleString()}</Text>
            <Text style={styles.statLbl}>Average expense</Text>
          </LinearGradient>
          <LinearGradient colors={['#fff', '#F8FAFC']} style={styles.statCard}>
            <Text style={styles.statEmoji}>🧾</Text>
            <Text style={styles.statVal}>{expenses.length}</Text>
            <Text style={styles.statLbl}>Transactions</Text>
          </LinearGradient>
          <LinearGradient colors={['#fff', '#F8FAFC']} style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statVal} numberOfLines={1}>
              {topCategory ? topCategory[0] : '—'}
            </Text>
            <Text style={styles.statLbl}>Top category</Text>
          </LinearGradient>
        </View>

 

  {/* Category breakdown with improved design */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Spending by category</Text>
          <View style={styles.categoryCard}>
            {Object.entries(byCategory).length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>No expenses yet</Text>
              </View>
            ) : (
              Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt], idx) => {
                  const pct = total > 0 ? (amt / total) * 100 : 0
                  return (
                    <View key={cat} style={[styles.categoryRow, idx !== 0 && styles.categoryRowBorder]}>
                      <View style={[styles.categoryIcon, { backgroundColor: catColors[cat as Category] + '20' }]}>
                        <View style={[styles.categoryDot, { backgroundColor: catColors[cat as Category] }]} />
                      </View>
                      <Text style={styles.categoryName}>{cat}</Text>
                      <View style={styles.categoryProgress}>
                        <View style={[styles.categoryProgressFill, { width: `${pct}%`, backgroundColor: catColors[cat as Category] }]} />
                      </View>
                      <View style={styles.categoryRight}>
                        <Text style={styles.categoryAmount}>₹{amt.toLocaleString()}</Text>
                        <Text style={styles.categoryPercent}>{pct.toFixed(0)}%</Text>
                      </View>
                    </View>
                  )
                })
            )}
          </View>
        </View>


        {/* Weekly spending with modern bars */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Weekly spending</Text>
          <View style={styles.weeklyCard}>
            {weeklyTotals.map((val, i) => {
              const heightPercent = (val / maxWeekly) * 100
              return (
                <View key={i} style={styles.weeklyBarContainer}>
                  <Text style={styles.weeklyBarAmount}>
                    {val > 0 ? `₹${Math.round(val / 1000)}k` : ''}
                  </Text>
                  <View style={styles.barBackground}>
                    <LinearGradient
                      colors={val > 0 ? ['#1D9E75', '#16825E'] : ['#E2E8F0', '#E2E8F0']}
                      style={[styles.barFill, { height: Math.max(6, heightPercent) }]}
                    />
                  </View>
                  <Text style={[styles.weeklyLabel, i === Math.floor((now.getDate() - 1) / 7) && styles.activeWeek]}>
                    W{i + 1}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

      

  
      </ScrollView>
    </SafeAreaView>
  )
}

export default SummaryScreen

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingBottom: 40 },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  headerMonth: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  headerTotal: { fontSize: 48, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },

  // Stat cards
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 20, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 0.5, borderColor: '#E2E8F0' },
  statEmoji: { fontSize: 24, marginBottom: 8 },
  statVal: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  statLbl: { fontSize: 11, color: '#64748B', fontWeight: '500' },

  // Section container
  sectionContainer: { marginBottom: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12, letterSpacing: -0.3 },

  // Budget card
  budgetCard: { backgroundColor: '#fff', borderRadius: 24, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  budgetLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  budgetAmount: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  budgetPercentBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30 },
  budgetPercentText: { fontSize: 18, fontWeight: '800' },
  progressTrack: { backgroundColor: '#E2E8F0', borderRadius: 12, height: 8, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 8, borderRadius: 12 },
  budgetHint: { fontSize: 12, textAlign: 'right', fontWeight: '600' },

  // Weekly chart
  weeklyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  weeklyBarContainer: { flex: 1, alignItems: 'center', gap: 8 },
  weeklyBarAmount: { fontSize: 10, color: '#1D9E75', fontWeight: '700' },
  barBackground: { width: '100%', height: 80, justifyContent: 'flex-end', backgroundColor: '#F1F5F9', borderRadius: 12, overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 12 },
  weeklyLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  activeWeek: { color: '#1D9E75', fontWeight: '800' },

  // Category breakdown
  categoryCard: { backgroundColor: '#fff', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  categoryRowBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  categoryIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { fontSize: 14, fontWeight: '600', color: '#0F172A', width: 75 },
  categoryProgress: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 8, height: 8, overflow: 'hidden', marginHorizontal: 12 },
  categoryProgressFill: { height: 8, borderRadius: 8 },
  categoryRight: { alignItems: 'flex-end', width: 80 },
  categoryAmount: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  categoryPercent: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#64748B' },

  // Total card
  totalCard: { borderRadius: 28, marginHorizontal: 16, marginTop: 8, marginBottom: 24, padding: 24, alignItems: 'center', shadowColor: '#1D9E75', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 8 },
  totalAmount: { fontSize: 44, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 16 },
  topCategoryChip: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 40, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)' },
  topCategoryText: { fontSize: 14, color: '#fff', fontWeight: '600' },
})