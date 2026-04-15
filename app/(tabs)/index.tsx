import { EmptyState } from '@/components/EmptyState'
import { ExpenseCard } from '@/components/ExpenseCard'
import { useBudgetStore } from '@/src/store/budgetStore'
import { useExpenseStore } from '@/src/store/expenseStore'
import { useGroupStore } from '@/src/store/groupStore'
import { colors } from '@/src/theme/colors'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useState } from 'react'

import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const CATEGORY_TABS = ['All', 'Food', 'Transport', 'Utilities', 'Shopping']

export default function HomeScreen() {
  const { expenses, deleteExpense, deleteExpensesByGroup } = useExpenseStore() // Add deleteExpensesByGroup
  const { monthlyLimit } = useBudgetStore()
  const { groups, deleteGroup } = useGroupStore() // Add deleteGroup
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All')

  const now = new Date()
  const monthly = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const total = monthly.reduce((sum, e) => sum + e.amount, 0)
  const remaining = monthlyLimit - total
  const percentage = monthlyLimit > 0 ? Math.min((total / monthlyLimit) * 100, 100) : 0

  // Group balance totals
  const totalOwed = groups.filter(g => g.balance > 0).reduce((s, g) => s + g.balance, 0)
  const totalOwe = groups.filter(g => g.balance < 0).reduce((s, g) => s + Math.abs(g.balance), 0)

  const displayedExpenses = (() => {
    let list = searchQuery.trim()
      ? expenses.filter(e =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
        )
      : expenses

    if (activeTab !== 'All') {
      list = list.filter(e => e.category.toLowerCase() === activeTab.toLowerCase())
    }
    return list
  })()

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

  const getGroupBadgeStyle = (group: (typeof groups)[0]) => {
    if (group.settled) return { bg: '#F1F5F9', text: '#64748B' }
    if (group.balance > 0) return { bg: '#DCFCE7', text: '#15803D' }
    return { bg: '#FEE2E2', text: '#B91C1C' }
  }

  const getGroupBadgeLabel = (group: (typeof groups)[0]) => {
    if (group.settled) return 'Settled'
    if (group.balance > 0) return `Owed ₹${group.balance.toLocaleString()}`
    return `Owe ₹${Math.abs(group.balance).toLocaleString()}`
  }

  const getGroupBarColor = (group: (typeof groups)[0]) => {
    if (group.settled) return '#94A3B8'
    if (group.balance > 0) return '#10B981'
    return '#EF4444'
  }

  // Function to delete group and all its expenses
  const deleteGroupCompletely = (groupId: string, groupName: string) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${groupName}"?\n\nThis will also delete ALL expenses in this group. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // First delete all expenses in the group
            deleteExpensesByGroup(groupId)
            // Then delete the group itself
            deleteGroup(groupId)
            
            Alert.alert('Success', `"${groupName}" and all its expenses have been deleted`)
          }
        }
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
              </View>

              {/* Total amount */}
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total spent this month</Text>
                <Text style={styles.totalAmount}>₹ {total.toLocaleString()}</Text>
              </View>

            </LinearGradient>

            {/* ── My Groups Section ── */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>MY GROUPS</Text>
              <TouchableOpacity onPress={() => router.push('/Group_creation')}>
                <Text style={styles.sectionLink}>+ new group</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupsScroll}
            >
              {groups.map(group => {
                const badge = getGroupBadgeStyle(group)
                return (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.groupCard}
                    onPress={() => router.push({ 
                      pathname: '/Group_expense' as any, 
                      params: { groupId: group.id } 
                    })}
                    onLongPress={() => deleteGroupCompletely(group.id, group.name)}
                    activeOpacity={0.75}
                    delayLongPress={500}
                  >
                    <View style={styles.groupCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.groupCardName} numberOfLines={1}>{group.name}</Text>
                        <Text style={styles.groupCardMembers}>{group.members}</Text>
                      </View>
                      <View style={[styles.groupBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.groupBadgeText, { color: badge.text }]}>
                          {getGroupBadgeLabel(group)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.groupProgressTrack}>
                      <View style={[
                        styles.groupProgressFill,
                        {
                          width: `${Math.round(group.progress * 100)}%`,
                          backgroundColor: getGroupBarColor(group),
                        },
                      ]} />
                    </View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            {/* ── Section Header + Category Tabs ── */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>
                {searchQuery ? 'SEARCH RESULTS' : 'MY EXPENSES'}
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{displayedExpenses.length} items</Text>
              </View>
            </View>

            {/* ── Category filter tabs ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
            >
              {CATEGORY_TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    marginBottom: 12,
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

  // ── Group balance pills ──
  groupPillRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  groupPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  groupPillLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 3,
  },
  groupPillValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
    marginBottom: 20,
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
  sectionLink: {
    fontSize: 12,
    color: '#1D9E75',
    fontWeight: '600',
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

  // ── Groups horizontal scroll ──
  groupsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 10,
    marginBottom: 20,
  },
  groupCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  groupCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  groupCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  groupCardMembers: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  groupProgressTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 99,
    overflow: 'hidden',
  },
  groupProgressFill: {
    height: 4,
    borderRadius: 99,
  },

  // ── Category tabs ──
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  tabActive: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#fff',
  },

  // ── Cards ──
  cardWrapper: {
    paddingHorizontal: 16,
  },
})