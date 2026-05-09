// app/Group_expense.tsx
import { Group, GroupExpense, deleteGroupExpense, subscribeToGroup, subscribeToGroupExpenses } from '@/src/services/groupService';
import { useAppSelector } from '@/src/store/hooks';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatRs = (amount: number) => {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN');
  return amount < 0 ? `- ₹${formatted}` : `₹${formatted}`;
};

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    Food: '🍔', Transport: '🚗', Shopping: '🛒',
    Bills: '💡', Health: '💊', Other: '📦',
  };
  return icons[category] || '📝';
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    Food: '#FFF7ED', Transport: '#EFF6FF', Shopping: '#FEF2F2',
    Bills: '#F0FDF4', Health: '#FDF2F8', Other: '#F8FAFC',
  };
  return colors[category] || '#F8FAFC';
};

const getCategoryAccent = (category: string): string => {
  const colors: Record<string, string> = {
    Food: '#F97316', Transport: '#3B82F6', Shopping: '#EF4444',
    Bills: '#10B981', Health: '#EC4899', Other: '#64748B',
  };
  return colors[category] || '#64748B';
};

interface BalanceResult {
  youOwe: number;
  youAreOwed: number;
  netBalance: number;
  balances: { memberName: string; amount: number; type: 'owe' | 'owed' }[];
}

export default function GroupExpenseScreen() {
  const { user } = useAppSelector(state => state.auth);
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [balanceData, setBalanceData] = useState<BalanceResult>({
    youOwe: 0, youAreOwed: 0, netBalance: 0, balances: [],
  });

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const unsubscribeGroup = subscribeToGroup(groupId, (fetchedGroup) => {
      if (fetchedGroup) setGroup(fetchedGroup);
      setLoading(false);
    });
    const unsubscribeExpenses = subscribeToGroupExpenses(groupId, (expenses) => {
      setGroupExpenses(expenses);
    });
    return () => { unsubscribeGroup(); unsubscribeExpenses(); };
  }, [groupId]);

  useEffect(() => {
    if (!group || !user) return;
    calculateBalances();
  }, [groupExpenses, group, user]);

  const calculateBalances = () => {
    const memberBalances: Record<string, number> = {};
    group?.members.forEach(member => { memberBalances[member.uid] = 0; });
    groupExpenses.forEach(expense => {
      const paidBy = expense.paidBy;
      const amount = expense.amount;
      const memberCount = group?.members.length || 1;
      const splitAmount = amount / memberCount;
      memberBalances[paidBy] += amount - splitAmount;
      group?.members.forEach(member => {
        if (member.uid !== paidBy) memberBalances[member.uid] -= splitAmount;
      });
    });
    const yourBalance = memberBalances[user?.uid || ''] || 0;
    const youAreOwed = yourBalance > 0 ? yourBalance : 0;
    const youOwe = yourBalance < 0 ? Math.abs(yourBalance) : 0;
    const balances: { memberName: string; amount: number; type: 'owe' | 'owed' }[] = [];
    group?.members.forEach(member => {
      if (member.uid !== user?.uid) {
        const balance = memberBalances[member.uid] || 0;
        if (balance > 0) balances.push({ memberName: member.name, amount: balance, type: 'owed' });
        else if (balance < 0) balances.push({ memberName: member.name, amount: Math.abs(balance), type: 'owe' });
      }
    });
    setBalanceData({ youOwe, youAreOwed, netBalance: youAreOwed - youOwe, balances });
  };

  const filteredExpenses = selectedMember === 'all'
    ? groupExpenses
    : groupExpenses.filter(exp => exp.paidBy === selectedMember);

  const confirmDeleteExpense = (expenseId: string) => {
    Alert.alert('Delete Expense', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroupExpense(groupId, expenseId);
            Alert.alert('Success', 'Expense deleted');
          } catch {
            Alert.alert('Error', 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  const renderExpenseItem = ({ item }: { item: GroupExpense }) => (
    <TouchableOpacity
      style={styles.expenseItem}
      onLongPress={() => confirmDeleteExpense(item.id)}
      activeOpacity={0.75}
      delayLongPress={500}
    >
      <View style={[styles.expIcon, { backgroundColor: getCategoryColor(item.category) }]}>
        <Text style={styles.expIconText}>{getCategoryIcon(item.category)}</Text>
      </View>
      <View style={styles.expInfo}>
        <Text style={styles.expName}>{item.title}</Text>
        <View style={styles.expMetaRow}>
          <Text style={styles.expDate}>{new Date(item.date).toLocaleDateString()}</Text>
          <View style={styles.expDot} />
          <Text style={styles.expCategory}>{item.category}</Text>
          {item.paidByName && (
            <>
              <View style={styles.expDot} />
              <Text style={styles.paidByText}>{item.paidByName}</Text>
            </>
          )}
        </View>
      </View>
      <View style={styles.expAmountCol}>
        <Text style={styles.expAmount}>{formatRs(item.amount)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0F1923', '#1A2432']} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading group...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0F1923', '#1A2432']} style={styles.errorContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.emptyEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Group Not Found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.goBackButton}>
            <LinearGradient colors={['#3B82F6', '#1D4ED8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.goBackGradient}>
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const totalSpent = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Dark Header Section */}
            <LinearGradient
              colors={['#0F1923', '#1A2432']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.headerSection}
            >
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupMeta}>{group.members.length} members</Text>
                </View>
                <View style={styles.headerSpacer} />
              </View>

              <View style={styles.inviteChip}>
                <Text style={styles.inviteLabel}>INVITE CODE</Text>
                <View style={styles.inviteSeparator} />
                <Text style={styles.inviteCode}>{group.inviteCode}</Text>
              </View>
            </LinearGradient>

            {/* Light Content Section */}
            <View style={styles.contentSection}>
              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statIconWrap}>
                    <Text style={styles.statIcon}>👥</Text>
                  </View>
                  <Text style={styles.statValue}>{group.members.length}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statIconWrap}>
                    <Text style={styles.statIcon}>🧾</Text>
                  </View>
                  <Text style={styles.statValue}>{groupExpenses.length}</Text>
                  <Text style={styles.statLabel}>Expenses</Text>
                </View>
                <View style={[styles.statCard, styles.statCardAccent]}>
                  <View style={[styles.statIconWrap, styles.statIconWrapAccent]}>
                    <Text style={styles.statIcon}>💰</Text>
                  </View>
                  <Text style={[styles.statValue, styles.statValueAccent]}>{formatRs(totalSpent)}</Text>
                  <Text style={[styles.statLabel, styles.statLabelAccent]}>Total Spent</Text>
                </View>
              </View>

   

              {/* Member Filter */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Filter by member</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <TouchableOpacity
                    style={[styles.filterChip, selectedMember === 'all' && styles.filterChipActive]}
                    onPress={() => setSelectedMember('all')}
                  >
                    <Text style={[styles.filterChipText, selectedMember === 'all' && styles.filterChipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {group.members.map(member => (
                    <TouchableOpacity
                      key={member.uid}
                      style={[styles.filterChip, selectedMember === member.uid && styles.filterChipActive]}
                      onPress={() => setSelectedMember(member.uid)}
                    >
                      <View style={styles.filterAvatar}>
                        <Text style={styles.filterAvatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.filterChipText, selectedMember === member.uid && styles.filterChipTextActive]}>
                        {member.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Expenses Header */}
              <View style={styles.expensesHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Expenses</Text>
                  <Text style={styles.expensesCount}>{filteredExpenses.length} item{filteredExpenses.length !== 1 ? 's' : ''}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addExpenseBtn}
                  onPress={() => router.push({ pathname: '/add-expense', params: { groupId: group.id } } as any)}
                >
                 
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        renderItem={renderExpenseItem}
        ListEmptyComponent={
          <View style={styles.emptyExpenseContainer}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyEmoji}>📭</Text>
            </View>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first expense</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/add-expense', params: { groupId: group.id } } as any)}
        activeOpacity={0.85}
      >
        <LinearGradient colors={['#3B82F6', '#1D4ED8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGradient}>
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#0F1923' 
  },
  listContent: { 
    paddingBottom: 100,
    backgroundColor: '#F1F5F9'
  },

  // Dark Header Section
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { 
    color: '#F0F4FF', 
    fontSize: 22, 
    fontWeight: '500' 
  },
  headerCenter: { 
    flex: 1, 
    alignItems: 'center' 
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F0F4FF',
    letterSpacing: -0.3,
  },
  groupMeta: {
    fontSize: 11,
    color: '#8BA3C7',
    marginTop: 2,
  },
  headerSpacer: { 
    width: 40 
  },
  inviteChip: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 30,
    gap: 10,
  },
  inviteLabel: {
    color: 'rgba(240, 244, 255, 0.6)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  inviteSeparator: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  inviteCode: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
  },

  // Light Content Section
  contentSection: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -12,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardAccent: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconWrapAccent: {
    backgroundColor: '#DBEAFE',
  },
  statIcon: { 
    fontSize: 16 
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  statValueAccent: { 
    color: '#1E40AF' 
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },
  statLabelAccent: { 
    color: '#3B82F6' 
  },

  // Balance Card
  balanceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  balanceLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  balanceOwe: {
    color: '#EF4444',
  },
  balanceOwed: {
    color: '#10B981',
  },

  // Section Blocks
  sectionBlock: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  filterScroll: { 
    marginBottom: 4 
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  expensesCount: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  addExpenseBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addExpenseGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addExpenseBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Filter Chips
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  filterAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
  },
  filterChipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  // Expense Items
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  separator: { 
    height: 0 
  },
  expIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expIconText: { 
    fontSize: 20 
  },
  expInfo: { 
    flex: 1 
  },
  expName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  expMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  expDate: { 
    fontSize: 12, 
    color: '#94A3B8' 
  },
  expDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  expCategory: { 
    fontSize: 12, 
    color: '#94A3B8' 
  },
  paidByText: { 
    fontSize: 12, 
    color: '#10B981', 
    fontWeight: '600' 
  },
  expAmountCol: { 
    alignItems: 'flex-end' 
  },
  expAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: -0.3,
  },

  // Empty States
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyExpenseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyEmoji: { 
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: { 
    fontSize: 14, 
    color: '#64748B', 
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#F0F4FF',
    marginBottom: 8,
  },
  goBackButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  goBackGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  goBackButtonText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 15 
  },

  // Loading
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 14, 
    color: '#8BA3C7' 
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { 
    fontSize: 28, 
    color: '#fff', 
    fontWeight: '300', 
    marginTop: -2 
  },
});