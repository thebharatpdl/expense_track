// app/Group_expense.tsx
import { Group, GroupExpense, deleteGroupExpense, subscribeToGroup, subscribeToGroupExpenses, updateGroup } from '@/src/services/groupService';
import { useAppSelector } from '@/src/store/hooks';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState('');
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
      if (fetchedGroup) {
        setGroup(fetchedGroup);
        setGroupName(fetchedGroup.name);
      }
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
        if (member.uid !== paidBy) {
          memberBalances[member.uid] -= splitAmount;
        }
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
        if (balance > 0) {
          balances.push({
            memberName: member.name,
            amount: balance,
            type: 'owed',
          });
        } else if (balance < 0) {
          balances.push({
            memberName: member.name,
            amount: Math.abs(balance),
            type: 'owe',
          });
        }
      }
    });
    
    setBalanceData({
      youOwe,
      youAreOwed,
      netBalance,
      balances,
    });
  };

  const filteredExpenses = selectedMember === 'all'
    ? groupExpenses
    : groupExpenses.filter(exp => exp.paidBy === selectedMember);

  const updateGroupName = async () => {
    if (!group || !groupName.trim()) return;
    
    try {
      await updateGroup(group.id, { name: groupName.trim() });
      setIsEditingName(false);
      Alert.alert('Success', 'Group name updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update group name');
    }
  };

  const confirmDeleteExpense = (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to remove this expense from the group?',
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
          }
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
      <Text style={[styles.expAmount, styles.amountRed]}>- {formatRs(item.amount)}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D9E75" />
          <Text style={styles.loadingText}>Loading group...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Not Found</Text>
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
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              
              {isEditingName ? (
                <View style={styles.editNameContainer}>
                  <TextInput
                    style={styles.groupNameInput}
                    value={groupName}
                    onChangeText={setGroupName}
                    autoFocus
                  />
                  <TouchableOpacity onPress={updateGroupName}>
                    <Text style={styles.saveButton}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsEditingName(false)}>
                    <Text style={styles.cancelButton}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.groupNameContainer}
                  onPress={() => setIsEditingName(true)}
                >
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.editIcon}>✎</Text>
                </TouchableOpacity>
              )}
              
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.inviteCodeCard}>
              <Text style={styles.inviteCodeLabel}>Invite Code</Text>
              <Text style={styles.inviteCode}>{group.inviteCode}</Text>
              <Text style={styles.inviteCodeHint}>Share this code with friends to join</Text>
            </View>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceTitle}>Balance Summary</Text>
              
              {balanceData.youOwe > 0 && (
                <View style={styles.balanceRowOwe}>
                  <Text style={styles.balanceLabel}>You owe</Text>
                  <Text style={styles.balanceAmountOwe}>{formatRs(balanceData.youOwe)}</Text>
                </View>
              )}
              
              {balanceData.youAreOwed > 0 && (
                <View style={styles.balanceRowOwed}>
                  <Text style={styles.balanceLabel}>You are owed</Text>
                  <Text style={styles.balanceAmountOwed}>{formatRs(balanceData.youAreOwed)}</Text>
                </View>
              )}
              
              {balanceData.balances.length > 0 && (
                <View style={styles.balanceDetails}>
                  <Text style={styles.balanceDetailsTitle}>Breakdown:</Text>
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
              
              {balanceData.youOwe === 0 && balanceData.youAreOwed === 0 && (
                <View style={styles.settledContainer}>
                  <Text style={styles.settledEmoji}>✅</Text>
                  <Text style={styles.settledText}>All settled up!</Text>
                </View>
              )}
            </View>

            <View style={styles.memberFilterSection}>
              <Text style={styles.memberFilterLabel}>Filter by:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberFilterScroll}>
                <TouchableOpacity
                  style={[styles.memberFilterChip, selectedMember === 'all' && styles.memberFilterChipActive]}
                  onPress={() => setSelectedMember('all')}
                >
                  <Text style={[styles.memberFilterText, selectedMember === 'all' && styles.memberFilterTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                {group.members.map(member => (
                  <TouchableOpacity
                    key={member.uid}
                    style={[styles.memberFilterChip, selectedMember === member.uid && styles.memberFilterChipActive]}
                    onPress={() => setSelectedMember(member.uid)}
                  >
                    <Text style={[styles.memberFilterText, selectedMember === member.uid && styles.memberFilterTextActive]}>
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

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
          </>
        }
        renderItem={renderExpenseItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first expense to this group
            </Text>
            <TouchableOpacity 
              style={styles.addExpenseBtn}
              onPress={() => router.push({
                pathname: '/add-expense',
                params: { groupId: group.id }
              } as any)}
            >
              <Text style={styles.addExpenseBtnText}>+ Add Expense</Text>
            </TouchableOpacity>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push({
          pathname: '/add-expense',
          params: { groupId: group.id }
        } as any)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  listContent: {
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1D9E75',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  groupNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  editIcon: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginHorizontal: 12,
  },
  groupNameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    paddingVertical: 4,
  },
  saveButton: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
  },
  inviteCodeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D9E75',
    letterSpacing: 4,
  },
  inviteCodeHint: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 8,
  },
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  balanceRowOwe: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  balanceRowOwed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  balanceAmountOwe: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  balanceAmountOwed: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  balanceDetails: {
    marginTop: 12,
  },
  balanceDetailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  balanceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  balanceDetailText: {
    fontSize: 13,
    color: '#8E8E93',
    width: 70,
  },
  balanceDetailName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  balanceDetailAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  oweText: {
    color: '#EF4444',
  },
  owedText: {
    color: '#10B981',
  },
  settledContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  settledEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  settledText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  memberFilterSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  memberFilterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  memberFilterScroll: {
    flexDirection: 'row',
  },
  memberFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  memberFilterChipActive: {
    backgroundColor: '#1D9E75',
  },
  memberFilterText: {
    fontSize: 13,
    color: '#64748B',
  },
  memberFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#E5E5EA',
  },
  expIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expIconText: {
    fontSize: 18,
  },
  expInfo: {
    flex: 1,
  },
  expName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  expSub: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  paidByText: {
    fontSize: 10,
    color: '#1D9E75',
    fontStyle: 'italic',
  },
  expAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountRed: {
    color: '#A32D2D',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  addExpenseBtn: {
    backgroundColor: '#1D9E75',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addExpenseBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  goBackButton: {
    backgroundColor: '#1D9E75',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  goBackButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '600',
  },
});