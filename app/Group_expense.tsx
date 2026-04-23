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
    Food: '🍔',
    Transport: '🚗',
    Shopping: '🛒',
    Bills: '💡',
    Health: '💊',
    Other: '📦',
  };
  return icons[category] || '📝';
};

const getCategoryBgColor = (category: string): string => {
  const colors: Record<string, string> = {
    Food: '#FAEEDA',
    Transport: '#E6F1FB',
    Shopping: '#FFE4E1',
    Bills: '#E0F7FA',
    Health: '#FCEBEB',
    Other: '#F2F2F7',
  };
  return colors[category] || '#F2F2F7';
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
    youOwe: 0,
    youAreOwed: 0,
    netBalance: 0,
    balances: [],
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
    return () => {
      unsubscribeGroup();
      unsubscribeExpenses();
    };
  }, [groupId]);

  useEffect(() => {
    if (!group || !user) return;
    calculateBalances();
  }, [groupExpenses, group, user]);

  const calculateBalances = () => {
    const memberBalances: Record<string, number> = {};
    group?.members.forEach(member => {
      memberBalances[member.uid] = 0;
    });
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
    const netBalance = youAreOwed - youOwe;
    const balances: { memberName: string; amount: number; type: 'owe' | 'owed' }[] = [];
    group?.members.forEach(member => {
      if (member.uid !== user?.uid) {
        const balance = memberBalances[member.uid] || 0;
        if (balance > 0) balances.push({ memberName: member.name, amount: balance, type: 'owed' });
        else if (balance < 0) balances.push({ memberName: member.name, amount: Math.abs(balance), type: 'owe' });
      }
    });
    setBalanceData({ youOwe, youAreOwed, netBalance, balances });
  };

  const filteredExpenses = selectedMember === 'all'
    ? groupExpenses
    : groupExpenses.filter(exp => exp.paidBy === selectedMember);

  const confirmDeleteExpense = (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Remove this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroupExpense(groupId, expenseId);
              Alert.alert('Success', 'Expense deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const renderExpenseItem = ({ item }: { item: GroupExpense }) => (
    <TouchableOpacity
      style={styles.expenseItem}
      onLongPress={() => confirmDeleteExpense(item.id)}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      <View style={[styles.expIcon, { backgroundColor: getCategoryBgColor(item.category) }]}>
        <Text style={styles.expIconText}>{getCategoryIcon(item.category)}</Text>
      </View>
      <View style={styles.expInfo}>
        <Text style={styles.expName}>{item.title}</Text>
        <Text style={styles.expSub}>
          {new Date(item.date).toLocaleDateString()} · {item.category}
          {item.paidByName && <Text style={styles.paidByText}> · Paid by {item.paidByName}</Text>}
        </Text>
      </View>
      <Text style={[styles.expAmount, styles.amountRed]}>-{formatRs(item.amount)}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" backgroundColor="#1D9E75" translucent={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D9E75" />
          <Text style={styles.loadingText}>Loading group...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" backgroundColor="#1D9E75" translucent={false} />
        <View style={styles.errorHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.errorTitle}>Group Not Found</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>😕</Text>
          <Text style={styles.emptyText}>Group not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.goBackButton}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#1D9E75" translucent={false} />
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={['#1D9E75', '#16825E', '#0F6648']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.groupName}>{group.name}</Text>
                <View style={styles.headerSpacer} />
              </View>
              <View style={styles.inviteChip}>
                <Text style={styles.inviteLabel}>Invite code:</Text>
                <Text style={styles.inviteCode}>{group.inviteCode}</Text>
              </View>
            </LinearGradient>

            {/* Balance Summary Card */}
            {/* <View style={styles.balanceCard}>
              <Text style={styles.balanceTitle}>Balance Summary</Text>
              <View style={styles.balanceMain}>
                {balanceData.youOwe > 0 && (
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceItemLabel}>You owe</Text>
                    <Text style={styles.balanceItemAmountOwe}>{formatRs(balanceData.youOwe)}</Text>
                  </View>
                )}
                {balanceData.youAreOwed > 0 && (
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceItemLabel}>You are owed</Text>
                    <Text style={styles.balanceItemAmountOwed}>{formatRs(balanceData.youAreOwed)}</Text>
                  </View>
                )}
                {balanceData.youOwe === 0 && balanceData.youAreOwed === 0 && (
                  <View style={styles.settledContainer}>
                    <Text style={styles.settledEmoji}>✅</Text>
                    <Text style={styles.settledText}>All settled up!</Text>
                  </View>
                )}
              </View>
              {balanceData.balances.length > 0 && (
                <View style={styles.balanceDetails}>
                  <Text style={styles.balanceDetailsTitle}>Breakdown</Text>
                  {balanceData.balances.map((bal, idx) => (
                    <View key={idx} style={styles.balanceDetailRow}>
                      <Text style={styles.balanceDetailText}>
                        {bal.type === 'owe' ? 'You owe' : 'Owes you'}
                      </Text>
                      <Text style={styles.balanceDetailName}>{bal.memberName}</Text>
                      <Text style={[
                        styles.balanceDetailAmount,
                        bal.type === 'owe' ? styles.oweText : styles.owedText
                      ]}>
                        {formatRs(bal.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View> */}

            {/* Member Filter */}
            <View style={styles.memberFilterSection}>
              <Text style={styles.memberFilterLabel}>Filter by member</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberFilterScroll}>
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
                    <Text style={[styles.filterChipText, selectedMember === member.uid && styles.filterChipTextActive]}>
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{group.members.length}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{groupExpenses.length}</Text>
                <Text style={styles.statLabel}>Expenses</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatRs(groupExpenses.reduce((sum, e) => sum + e.amount, 0))}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {/* Expenses Header */}
            <View style={styles.expensesHeader}>
              <Text style={styles.expensesTitle}>Expenses</Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/add-expense', params: { groupId: group.id } } as any)}
              >
                <Text style={styles.addButton}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={renderExpenseItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first expense</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/add-expense', params: { groupId: group.id } } as any)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { paddingBottom: 100 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  groupName: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', flex: 1 },
  headerSpacer: { width: 40 },
  inviteChip: { flexDirection: 'row', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 30, gap: 8 },
  inviteLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  inviteCode: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },

  // Balance Card
  balanceCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 20, padding: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  balanceTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  balanceMain: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  balanceItem: { alignItems: 'center' },
  balanceItemLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  balanceItemAmountOwe: { fontSize: 18, fontWeight: '700', color: '#EF4444' },
  balanceItemAmountOwed: { fontSize: 18, fontWeight: '700', color: '#10B981' },
  settledContainer: { alignItems: 'center', paddingVertical: 8 },
  settledEmoji: { fontSize: 28, marginBottom: 4 },
  settledText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  balanceDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  balanceDetailsTitle: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  balanceDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  balanceDetailText: { fontSize: 13, color: '#64748B', width: 70 },
  balanceDetailName: { flex: 1, fontSize: 13, fontWeight: '500', color: '#0F172A' },
  balanceDetailAmount: { fontSize: 13, fontWeight: '600' },
  oweText: { color: '#EF4444' },
  owedText: { color: '#10B981' },

  // Member Filter
  memberFilterSection: { marginTop: 20, marginBottom: 12, paddingHorizontal: 16 },
  memberFilterLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  memberFilterScroll: { flexDirection: 'row' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 8 },
  filterChipActive: { backgroundColor: '#1D9E75' },
  filterChipText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },

  // Stats Card
  statsCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, padding: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16 },

  // Expenses Header
  expensesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  expensesTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  addButton: { fontSize: 14, color: '#1D9E75', fontWeight: '600' },

  // Expense Items
  expenseItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff' },
  separator: { height: 0.5, backgroundColor: '#E2E8F0', marginLeft: 68 },
  expIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  expIconText: { fontSize: 20 },
  expInfo: { flex: 1 },
  expName: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  expSub: { fontSize: 12, color: '#64748B' },
  paidByText: { color: '#1D9E75', fontWeight: '500' },
  expAmount: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  amountRed: { color: '#EF4444' },

  // Empty State
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32, backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, marginTop: 20 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  emptyText: { fontSize: 16, color: '#64748B', marginBottom: 20 },
  goBackButton: { backgroundColor: '#1D9E75', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  goBackButtonText: { color: '#fff', fontWeight: '600' },

  // Error header
  errorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#1D9E75' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B' },

  // FAB
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '600' },
});