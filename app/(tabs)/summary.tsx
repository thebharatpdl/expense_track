// app/summary.tsx
import { GroupExpense, subscribeToGroupExpenses, subscribeToUserGroups } from '@/src/services/groupService'
import { subscribeToUserExpenses, UserExpense } from '@/src/services/userExpenseService'
import { useAppSelector } from '@/src/store/hooks'
import { Category } from '@/src/types'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// ─── Color Tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:          '#0F1923',
  navyLight:     '#1A2B3C',
  amber:         '#EAAF35',
  amberDark:     '#C8931E',
  amberBg:       'rgba(234,175,53,0.12)',
  white:         '#FFFFFF',
  surface:       '#F4F6F9',
  card:          '#FFFFFF',
  textPrimary:   '#0F1923',
  textSecondary: '#8A9BB0',
  border:        '#F4F6F9',
  red:           '#E85B4A',
  green:         '#10B981',
}

// Category accent colors — kept vibrant so bars are readable
const CAT_COLORS: Record<Category, string> = {
  Food:      '#F59E0B',
  Transport: '#3B82F6',
  Shopping:  '#8B5CF6',
  Bills:     '#10B981',
  Health:    '#EF4444',
  Other:     '#6B7280',
}

const CAT_BG: Record<Category, string> = {
  Food:      '#FFF3E0',
  Transport: '#E8F4FD',
  Shopping:  '#F5F3FF',
  Bills:     '#F0FDF4',
  Health:    '#FEF2F2',
  Other:     '#F3F4F6',
}

type CombinedExpense = {
  id: string
  title: string
  amount: number
  category: Category
  date: string
  type: 'personal' | 'group'
}

const SummaryScreen = () => {
  const { user } = useAppSelector(state => state.auth)
  const { monthlyLimit } = useAppSelector(state => state.budget)
  const [personalExpenses, setPersonalExpenses] = useState<UserExpense[]>([])
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([])
  const [allExpenses, setAllExpenses] = useState<CombinedExpense[]>([])

  useEffect(() => {
    if (!user) return
    return subscribeToUserExpenses(user.uid, setPersonalExpenses)
  }, [user])

  useEffect(() => {
    if (!user) return
    return subscribeToUserGroups(user.uid, (fetchedGroups) => {
      const unsubs = fetchedGroups.map(group =>
        subscribeToGroupExpenses(group.id, (expenses) => {
          setGroupExpenses(prev => [
            ...prev.filter(e => e.groupId !== group.id),
            ...expenses,
          ])
        })
      )
      return () => unsubs.forEach(u => u())
    })
  }, [user])

  useEffect(() => {
    const combined: CombinedExpense[] = [
      ...personalExpenses.map(exp => ({
        id: exp.id, title: exp.title, amount: exp.amount,
        category: exp.category as Category, date: exp.date, type: 'personal' as const,
      })),
      ...groupExpenses
        .filter(exp => exp.paidBy === user?.uid)
        .map(exp => ({
          id: exp.id, title: exp.title, amount: exp.amount,
          category: exp.category as Category, date: exp.date, type: 'group' as const,
        })),
    ]
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setAllExpenses(combined)
  }, [personalExpenses, groupExpenses, user])

  const now = new Date()
  const monthExpenses = allExpenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const total = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const avgExpense = monthExpenses.length > 0 ? total / monthExpenses.length : 0

  const byCategory = monthExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const weeklyTotals = [0, 0, 0, 0]
  monthExpenses.forEach(e => {
    const week = Math.min(Math.floor((new Date(e.date).getDate() - 1) / 7), 3)
    weeklyTotals[week] += e.amount
  })
  const maxWeekly = Math.max(...weeklyTotals, 1)
  const currentWeek = Math.min(Math.floor((now.getDate() - 1) / 7), 3)

  const budgetPercent = monthlyLimit > 0 ? Math.min((total / monthlyLimit) * 100, 100) : 0
  const remaining = monthlyLimit - total

  const getBudgetBarColor = () => {
    if (budgetPercent >= 100) return C.red
    if (budgetPercent >= 80) return '#F59E0B'
    return C.amber
  }

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" backgroundColor={C.navy} translucent={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={[C.navyLight, C.navy]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* decorative orbs */}
          <View style={styles.orb1} />
          <View style={styles.orb2} />

          <Text style={styles.headerMonth}>
            {now.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
          </Text>
          <Text style={styles.headerTotal}>₹{total.toLocaleString()}</Text>
          <Text style={styles.headerSub}>total spent this month</Text>

          {/* Three inline stat badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeVal}>₹{Math.round(avgExpense).toLocaleString()}</Text>
              <Text style={styles.badgeLbl}>Avg / expense</Text>
            </View>
            <View style={styles.badgeDivider} />
            <View style={styles.badge}>
              <Text style={styles.badgeVal}>{monthExpenses.length}</Text>
              <Text style={styles.badgeLbl}>Transactions</Text>
            </View>
            <View style={styles.badgeDivider} />
            <View style={styles.badge}>
              <Text style={styles.badgeVal} numberOfLines={1}>
                {topCategory ? topCategory[0] : '—'}
              </Text>
              <Text style={styles.badgeLbl}>Top category</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Budget Card ── */}
        {monthlyLimit > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Budget</Text>
            <View style={styles.card}>
              <View style={styles.budgetTop}>
                <View>
                  <Text style={styles.budgetLbl}>Spent so far</Text>
                  <Text style={styles.budgetAmt}>₹{total.toLocaleString()}</Text>
                </View>
                <View style={styles.budgetPctBox}>
                  <Text style={[styles.budgetPctNum, { color: C.amberDark }]}>
                    {budgetPercent.toFixed(0)}%
                  </Text>
                  <Text style={styles.budgetPctLbl}>USED</Text>
                </View>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, {
                  width: `${budgetPercent}%` as any,
                  backgroundColor: getBudgetBarColor(),
                }]} />
              </View>
              <View style={styles.barFooter}>
                <Text style={styles.barFooterMuted}>₹0</Text>
                <Text style={styles.barFooterHighlight}>
                  {remaining > 0
                    ? `₹${remaining.toLocaleString()} left`
                    : 'Budget exceeded!'}
                </Text>
                <Text style={styles.barFooterMuted}>₹{monthlyLimit.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Category Breakdown ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <View style={styles.card}>
            {Object.entries(byCategory).length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>No expenses this month</Text>
              </View>
            ) : (
              Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt], idx) => {
                  const pct = total > 0 ? (amt / total) * 100 : 0
                  const color = CAT_COLORS[cat as Category] || '#8A9BB0'
                  const bg = CAT_BG[cat as Category] || '#F3F4F6'
                  return (
                    <View
                      key={cat}
                      style={[styles.catRow, idx !== 0 && styles.catRowBorder]}
                    >
                      <View style={[styles.catIconWrap, { backgroundColor: bg }]}>
                        <View style={[styles.catDot, { backgroundColor: color }]} />
                      </View>
                      <Text style={styles.catName}>{cat}</Text>
                      <View style={styles.catBarTrack}>
                        <View style={[styles.catBarFill, {
                          width: `${pct}%` as any,
                          backgroundColor: color,
                        }]} />
                      </View>
                      <View style={styles.catRight}>
                        <Text style={styles.catAmt}>₹{amt.toLocaleString()}</Text>
                        <Text style={styles.catPct}>{pct.toFixed(0)}%</Text>
                      </View>
                    </View>
                  )
                })
            )}
          </View>
        </View>

        {/* ── Weekly Breakdown ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
          <View style={styles.card}>
            <View style={styles.weeklyRow}>
              {weeklyTotals.map((val, i) => {
                const heightPct = (val / maxWeekly) * 100
                const isActive = i === currentWeek
                const hasVal = val > 0
                return (
                  <View key={i} style={styles.weekCol}>
                    <Text style={[styles.weekAmt, { opacity: hasVal ? 1 : 0 }]}>
                      {val >= 1000
                        ? `₹${(val / 1000).toFixed(1)}k`
                        : val > 0 ? `₹${val}` : ''}
                    </Text>
                    <View style={styles.weekBarBg}>
                      <View style={[
                        styles.weekBarFill,
                        {
                          height: `${Math.max(hasVal ? 8 : 0, heightPct)}%` as any,
                          backgroundColor: isActive ? C.amber : hasVal ? 'rgba(234,175,53,0.45)' : 'transparent',
                        },
                      ]} />
                    </View>
                    <Text style={[styles.weekLbl, isActive && styles.weekLblActive]}>
                      Wk {i + 1}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        </View>

        {/* ── Personal vs Group Split ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal vs Group</Text>
          <View style={styles.card}>
            {(() => {
              const personalTotal = monthExpenses
                .filter(e => e.type === 'personal')
                .reduce((s, e) => s + e.amount, 0)
              const groupTotal = monthExpenses
                .filter(e => e.type === 'group')
                .reduce((s, e) => s + e.amount, 0)
              const personalPct = total > 0 ? (personalTotal / total) * 100 : 50
              return (
                <View>
                  <View style={styles.splitRow}>
                    <View style={styles.splitItem}>
                      <View style={[styles.splitDot, { backgroundColor: C.amber }]} />
                      <Text style={styles.splitLabel}>Personal</Text>
                    </View>
                    <Text style={styles.splitAmt}>₹{personalTotal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.splitBarTrack}>
                    <View style={[styles.splitBarLeft, { width: `${personalPct}%` as any }]} />
                    <View style={[styles.splitBarRight, { width: `${100 - personalPct}%` as any }]} />
                  </View>
                  <View style={styles.splitRow}>
                    <View style={styles.splitItem}>
                      <View style={[styles.splitDot, { backgroundColor: C.navy }]} />
                      <Text style={styles.splitLabel}>Group</Text>
                    </View>
                    <Text style={styles.splitAmt}>₹{groupTotal.toLocaleString()}</Text>
                  </View>
                </View>
              )
            })()}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

export default SummaryScreen

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  content: { paddingBottom: 48, backgroundColor: C.surface },

  // ── Header ──
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(234,175,53,0.05)',
    top: -80,
    right: -60,
  },
  orb2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(234,175,53,0.04)',
    bottom: -40,
    left: 10,
  },
  headerMonth: {
    fontSize: 11,
    color: 'rgba(234,175,53,0.7)',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  headerTotal: {
    fontSize: 46,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -2,
    lineHeight: 52,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
    marginBottom: 20,
  },

  // Stat badges inside header
  badgeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    width: '100%',
  },
  badge: { flex: 1, alignItems: 'center', gap: 3 },
  badgeVal: {
    fontSize: 15,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.3,
  },
  badgeLbl: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  badgeDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },

  // ── Sections ──
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSecondary,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.055,
    shadowRadius: 10,
    elevation: 3,
  },

  // ── Budget ──
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  budgetLbl: { fontSize: 11, color: C.textSecondary, fontWeight: '500', marginBottom: 3 },
  budgetAmt: { fontSize: 22, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },
  budgetPctBox: {
    backgroundColor: 'rgba(234,175,53,0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  budgetPctNum: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  budgetPctLbl: { fontSize: 9, color: C.amberDark, fontWeight: '700', letterSpacing: 0.5 },
  barTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: { height: 7, borderRadius: 4 },
  barFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  barFooterMuted: { fontSize: 11, color: C.textSecondary, fontWeight: '500' },
  barFooterHighlight: { fontSize: 11, color: C.textPrimary, fontWeight: '700' },

  // ── Categories ──
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 10 },
  catRowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  catIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: 13, fontWeight: '600', color: C.textPrimary, width: 72 },
  catBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  catBarFill: { height: 6, borderRadius: 3 },
  catRight: { width: 80, alignItems: 'flex-end' },
  catAmt: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  catPct: { fontSize: 10, color: C.textSecondary, fontWeight: '600' },

  // ── Weekly ──
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  weekCol: { flex: 1, alignItems: 'center', gap: 6 },
  weekAmt: { fontSize: 10, fontWeight: '700', color: C.amber, height: 14 },
  weekBarBg: {
    width: '100%',
    height: 88,
    backgroundColor: '#F4F6F9',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  weekBarFill: { width: '100%', borderRadius: 10 },
  weekLbl: { fontSize: 11, fontWeight: '600', color: C.textSecondary },
  weekLblActive: { color: C.textPrimary, fontWeight: '800' },

  // ── Personal vs Group ──
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  splitItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  splitDot: { width: 10, height: 10, borderRadius: 5 },
  splitLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  splitAmt: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  splitBarTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: C.navy,
  },
  splitBarLeft: { height: 8, backgroundColor: C.amber },
  splitBarRight: { height: 8, backgroundColor: C.navy },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: C.textSecondary, fontWeight: '500' },
})











// // app/summary.tsx
// import { Group, GroupExpense, subscribeToGroupExpenses, subscribeToUserGroups } from '@/src/services/groupService'
// import { subscribeToUserExpenses, UserExpense } from '@/src/services/userExpenseService'
// import { useAppSelector } from '@/src/store/hooks'
// import { Category } from '@/src/types'
// import { LinearGradient } from 'expo-linear-gradient'
// import { StatusBar } from 'expo-status-bar'
// import React, { useEffect, useState } from 'react'
// import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native'
// import { SafeAreaView } from 'react-native-safe-area-context'

// const { width: screenWidth } = Dimensions.get('window')

// const catColors: Record<Category, string> = {
//   Food: '#F59E0B', 
//   Transport: '#3B82F6', 
//   Shopping: '#8B5CF6',
//   Bills: '#10B981', 
//   Health: '#EF4444', 
//   Other: '#6B7280',
// }

// type CombinedExpense = {
//   id: string;
//   title: string;
//   amount: number;
//   category: Category;
//   date: string;
//   type: 'personal' | 'group';
// }

// const SummaryScreen = () => {
//   const { user } = useAppSelector(state => state.auth);
//   const { monthlyLimit } = useAppSelector(state => state.budget);
//   const [personalExpenses, setPersonalExpenses] = useState<UserExpense[]>([])
//   const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([])
//   const [groups, setGroups] = useState<Group[]>([])
//   const [allExpenses, setAllExpenses] = useState<CombinedExpense[]>([])

//   useEffect(() => {
//     if (!user) return;
//     const unsubscribe = subscribeToUserExpenses(user.uid, setPersonalExpenses)
//     return () => unsubscribe()
//   }, [user])

//   useEffect(() => {
//     if (!user) return;
//     const unsubscribeGroups = subscribeToUserGroups(user.uid, (fetchedGroups) => {
//       setGroups(fetchedGroups)
//       const unsubscribes = fetchedGroups.map(group =>
//         subscribeToGroupExpenses(group.id, (expenses) => {
//           setGroupExpenses(prev => {
//             const other = prev.filter(e => e.groupId !== group.id)
//             return [...other, ...expenses]
//           })
//         })
//       )
//       return () => unsubscribes.forEach(unsub => unsub())
//     })
//     return () => unsubscribeGroups()
//   }, [user])

//   useEffect(() => {
//     const combined: CombinedExpense[] = [
//       ...personalExpenses.map(exp => ({
//         id: exp.id,
//         title: exp.title,
//         amount: exp.amount,
//         category: exp.category as Category,
//         date: exp.date,
//         type: 'personal' as const,
//       })),
//       ...groupExpenses
//         .filter(exp => exp.paidBy === user?.uid)
//         .map(exp => ({
//           id: exp.id,
//           title: exp.title,
//           amount: exp.amount,
//           category: exp.category as Category,
//           date: exp.date,
//           type: 'group' as const,
//         })),
//     ]
//     combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
//     setAllExpenses(combined)
//   }, [personalExpenses, groupExpenses, user])

//   const now = new Date()
//   const expenses = allExpenses.filter(e => {
//     const d = new Date(e.date)
//     return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
//   })

//   const byCategory = expenses.reduce((acc, e) => {
//     acc[e.category] = (acc[e.category] || 0) + e.amount
//     return acc
//   }, {} as Record<string, number>)

//   const weeklyTotals = [0, 0, 0, 0]
//   expenses.forEach(e => {
//     const week = Math.min(Math.floor((new Date(e.date).getDate() - 1) / 7), 3)
//     weeklyTotals[week] += e.amount
//   })

//   const total = expenses.reduce((s, e) => s + e.amount, 0)
//   const maxWeekly = Math.max(...weeklyTotals, 1)
//   const budgetPercent = monthlyLimit > 0 ? Math.min((total / monthlyLimit) * 100, 100) : 0
//   const budgetColor = budgetPercent < 60 ? '#10B981' : budgetPercent < 85 ? '#F59E0B' : '#EF4444'
//   const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
//   const avgExpense = expenses.length > 0 ? total / expenses.length : 0

//   return (
//     <SafeAreaView style={styles.safe} edges={['top']}>
//       <StatusBar style="light" backgroundColor="#1D9E75" translucent={false} />
//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
//         {/* Header with large total */}
//         <LinearGradient
//           colors={['#1D9E75', '#16825E', '#0F6648']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.header}
//         >
//           <Text style={styles.headerMonth}>
//             {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
//           </Text>
//           <Text style={styles.headerTotal}>₹ {total.toLocaleString()}</Text>
//           <Text style={styles.headerSub}>total spent</Text>
//         </LinearGradient>

//         {/* Three stat cards blended with gradient */}
//         <View style={styles.statsRow}>
//           <LinearGradient colors={['#fff', '#F8FAFC']} style={styles.statCard}>
//             <Text style={styles.statEmoji}>📊</Text>
//             <Text style={styles.statVal}>₹{Math.round(avgExpense).toLocaleString()}</Text>
//             <Text style={styles.statLbl}>Average expense</Text>
//           </LinearGradient>
//           <LinearGradient colors={['#fff', '#F8FAFC']} style={styles.statCard}>
//             <Text style={styles.statEmoji}>🧾</Text>
//             <Text style={styles.statVal}>{expenses.length}</Text>
//             <Text style={styles.statLbl}>Transactions</Text>
//           </LinearGradient>
//           <LinearGradient colors={['#fff', '#F8FAFC']} style={styles.statCard}>
//             <Text style={styles.statEmoji}>🏆</Text>
//             <Text style={styles.statVal} numberOfLines={1}>
//               {topCategory ? topCategory[0] : '—'}
//             </Text>
//             <Text style={styles.statLbl}>Top category</Text>
//           </LinearGradient>
//         </View>

 

//   {/* Category breakdown with improved design */}
//         <View style={styles.sectionContainer}>
//           <Text style={styles.sectionTitle}>Spending by category</Text>
//           <View style={styles.categoryCard}>
//             {Object.entries(byCategory).length === 0 ? (
//               <View style={styles.emptyState}>
//                 <Text style={styles.emptyEmoji}>📭</Text>
//                 <Text style={styles.emptyText}>No expenses yet</Text>
//               </View>
//             ) : (
//               Object.entries(byCategory)
//                 .sort((a, b) => b[1] - a[1])
//                 .map(([cat, amt], idx) => {
//                   const pct = total > 0 ? (amt / total) * 100 : 0
//                   return (
//                     <View key={cat} style={[styles.categoryRow, idx !== 0 && styles.categoryRowBorder]}>
//                       <View style={[styles.categoryIcon, { backgroundColor: catColors[cat as Category] + '20' }]}>
//                         <View style={[styles.categoryDot, { backgroundColor: catColors[cat as Category] }]} />
//                       </View>
//                       <Text style={styles.categoryName}>{cat}</Text>
//                       <View style={styles.categoryProgress}>
//                         <View style={[styles.categoryProgressFill, { width: `${pct}%`, backgroundColor: catColors[cat as Category] }]} />
//                       </View>
//                       <View style={styles.categoryRight}>
//                         <Text style={styles.categoryAmount}>₹{amt.toLocaleString()}</Text>
//                         <Text style={styles.categoryPercent}>{pct.toFixed(0)}%</Text>
//                       </View>
//                     </View>
//                   )
//                 })
//             )}
//           </View>
//         </View>


//         {/* Weekly spending with modern bars */}
//         <View style={styles.sectionContainer}>
//           <Text style={styles.sectionTitle}>Weekly spending</Text>
//           <View style={styles.weeklyCard}>
//             {weeklyTotals.map((val, i) => {
//               const heightPercent = (val / maxWeekly) * 100
//               return (
//                 <View key={i} style={styles.weeklyBarContainer}>
//                   <Text style={styles.weeklyBarAmount}>
//                     {val > 0 ? `₹${Math.round(val / 1000)}k` : ''}
//                   </Text>
//                   <View style={styles.barBackground}>
//                     <LinearGradient
//                       colors={val > 0 ? ['#1D9E75', '#16825E'] : ['#E2E8F0', '#E2E8F0']}
//                       style={[styles.barFill, { height: Math.max(6, heightPercent) }]}
//                     />
//                   </View>
//                   <Text style={[styles.weeklyLabel, i === Math.floor((now.getDate() - 1) / 7) && styles.activeWeek]}>
//                     W{i + 1}
//                   </Text>
//                 </View>
//               )
//             })}
//           </View>
//         </View>

      

  
//       </ScrollView>
//     </SafeAreaView>
//   )
// }

// export default SummaryScreen

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: '#F8FAFC' },
//   content: { paddingBottom: 40 },

//   // Header
//   header: {
//     paddingHorizontal: 24,
//     paddingTop: 24,
//     paddingBottom: 32,
//     borderBottomLeftRadius: 32,
//     borderBottomRightRadius: 32,
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   headerMonth: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
//   headerTotal: { fontSize: 48, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 4 },
//   headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },

//   // Stat cards
//   statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
//   statCard: { flex: 1, borderRadius: 20, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 0.5, borderColor: '#E2E8F0' },
//   statEmoji: { fontSize: 24, marginBottom: 8 },
//   statVal: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
//   statLbl: { fontSize: 11, color: '#64748B', fontWeight: '500' },

//   // Section container
//   sectionContainer: { marginBottom: 24, paddingHorizontal: 16 },
//   sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12, letterSpacing: -0.3 },

//   // Budget card
//   budgetCard: { backgroundColor: '#fff', borderRadius: 24, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
//   budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
//   budgetLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
//   budgetAmount: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
//   budgetPercentBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30 },
//   budgetPercentText: { fontSize: 18, fontWeight: '800' },
//   progressTrack: { backgroundColor: '#E2E8F0', borderRadius: 12, height: 8, overflow: 'hidden', marginBottom: 8 },
//   progressFill: { height: 8, borderRadius: 12 },
//   budgetHint: { fontSize: 12, textAlign: 'right', fontWeight: '600' },

//   // Weekly chart
//   weeklyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
//   weeklyBarContainer: { flex: 1, alignItems: 'center', gap: 8 },
//   weeklyBarAmount: { fontSize: 10, color: '#1D9E75', fontWeight: '700' },
//   barBackground: { width: '100%', height: 80, justifyContent: 'flex-end', backgroundColor: '#F1F5F9', borderRadius: 12, overflow: 'hidden' },
//   barFill: { width: '100%', borderRadius: 12 },
//   weeklyLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
//   activeWeek: { color: '#1D9E75', fontWeight: '800' },

//   // Category breakdown
//   categoryCard: { backgroundColor: '#fff', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
//   categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
//   categoryRowBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
//   categoryIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
//   categoryDot: { width: 10, height: 10, borderRadius: 5 },
//   categoryName: { fontSize: 14, fontWeight: '600', color: '#0F172A', width: 75 },
//   categoryProgress: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 8, height: 8, overflow: 'hidden', marginHorizontal: 12 },
//   categoryProgressFill: { height: 8, borderRadius: 8 },
//   categoryRight: { alignItems: 'flex-end', width: 80 },
//   categoryAmount: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
//   categoryPercent: { fontSize: 11, color: '#64748B', fontWeight: '600' },
//   emptyState: { alignItems: 'center', paddingVertical: 32 },
//   emptyEmoji: { fontSize: 48, marginBottom: 12 },
//   emptyText: { fontSize: 14, color: '#64748B' },

//   // Total card
//   totalCard: { borderRadius: 28, marginHorizontal: 16, marginTop: 8, marginBottom: 24, padding: 24, alignItems: 'center', shadowColor: '#1D9E75', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
//   totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 8 },
//   totalAmount: { fontSize: 44, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 16 },
//   topCategoryChip: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 40, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)' },
//   topCategoryText: { fontSize: 14, color: '#fff', fontWeight: '600' },
// })