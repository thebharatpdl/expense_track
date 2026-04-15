import { useExpenseStore } from '@/src/store/expenseStore';
import { useGroupStore } from '@/src/store/groupStore';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Helper to format currency in Nepalese Rupees
const formatRs = (amount: number) => {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN');
  return amount < 0 ? `- Rs ${formatted}` : `Rs ${formatted}`;
};

// Helper to get member count from members string
const getMemberCount = (membersString: string): number => {
  const members = membersString.split(/[,+]/).map(m => m.trim());
  return members.length;
};

// Category icons and background colors
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    Food: '🍔',
    Transport: '🚗',
    Shopping: '🛒',
    Bills: '💡',
    Health: '💊',
    Entertainment: '🎬',
    Utilities: '⚡',
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
    Entertainment: '#F3E8FF',
    Utilities: '#EAF3DE',
    Other: '#F2F2F7',
  };
  return colors[category] || '#F2F2F7';
};

export default function HomeScreen() {
  const { expenses, deleteExpense } = useExpenseStore();
  const { groups } = useGroupStore();
  const { groupId } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('All');
  const [personName, setPersonName] = useState('Ram');
  const [isEditingPerson, setIsEditingPerson] = useState(false);

  // Get current group
  const currentGroup = groups.find(g => g.id === groupId);
  const memberCount = currentGroup ? getMemberCount(currentGroup.members) : 2;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter expenses by groupId first
  const groupExpenses = groupId 
    ? expenses.filter(exp => exp.groupId === groupId)
    : expenses;

  // Filter monthly expenses
  const monthlyExpenses = groupExpenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });

  // Calculate totals
  const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Calculate who owes whom based on member count
  const expensesPaidByYou = monthlyExpenses
    .filter(exp => !exp.paidBy || exp.paidBy === personName)
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  const expensesPaidByOthers = monthlyExpenses
    .filter(exp => exp.paidBy && exp.paidBy !== personName)
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  // Calculate based on number of members
  const youAreOwed = (expensesPaidByYou * (memberCount - 1)) / memberCount;
  const youOwe = expensesPaidByOthers / memberCount;
  const netBalance = youAreOwed - youOwe;

  // Get unique categories
  const allCategories = ['All', ...new Set(groupExpenses.map(exp => exp.category))];
  
  // Filter expenses by category
  const filteredExpenses = activeTab === 'All' 
    ? groupExpenses 
    : groupExpenses.filter(exp => exp.category === activeTab);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) }
      ]
    );
  };

  const handleLongPress = (id: string) => {
    handleDeleteExpense(id);
  };

  const renderExpenseItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.expenseItem}
      onLongPress={() => handleLongPress(item.id)}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      <View style={[styles.expIcon, { backgroundColor: getCategoryBgColor(item.category) }]}>
        <Text style={styles.expIconText}>{getCategoryIcon(item.category)}</Text>
      </View>
      <View style={styles.expInfo}>
        <Text style={styles.expName}>{item.title}</Text>
        <Text style={styles.expSub}>
          {getRelativeDate(item.date)} · {item.category}
          {item.paidBy && <Text style={styles.paidByText}> · Paid by {item.paidBy}</Text>}
        </Text>
      </View>
      <Text style={[styles.expAmount, styles.amountRed]}>- {formatRs(item.amount)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Greeting and Editable Person Name - NO SCREEN TITLE HERE */}
      <View style={styles.topBar}>
        <View>
          <View style={styles.greetingRow}>
            <Text style={styles.topBarName}>{getGreeting()}, </Text>
            {isEditingPerson ? (
              <TextInput
                style={styles.personNameInput}
                value={personName}
                onChangeText={setPersonName}
                onBlur={() => setIsEditingPerson(false)}
                onSubmitEditing={() => setIsEditingPerson(false)}
                autoFocus
                maxLength={20}
              />
            ) : (
              <TouchableOpacity onPress={() => setIsEditingPerson(true)}>
                <View style={styles.personNameRow}>
                  <Text style={styles.personName}>{personName}</Text>
                  <Text style={styles.editIcon}>✎</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Show group name if in a group, otherwise nothing */}
          {currentGroup && (
            <Text style={styles.groupNameText}>{currentGroup.name}</Text>
          )}
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {personName.substring(0, 2).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Net Worth Card */}
      <View style={styles.netCard}>
        <Text style={styles.netLabel}>Total expense this month</Text>
        <Text style={styles.netAmount}>{formatRs(totalSpent)}</Text>
        {currentGroup && (
          <Text style={styles.netSubLabel}>
            Split among {memberCount} members
          </Text>
        )}
        <View style={styles.netRow}>
          <View style={[styles.netPill, styles.netPillWhite]}>
            <Text style={[styles.netPillLabel, styles.netPillLabelWhite]}>You are owed</Text>
            <Text style={[styles.netPillVal, styles.netPillValWhite]}>{formatRs(youAreOwed)}</Text>
          </View>
          <View style={[styles.netPill, styles.netPillRed]}>
            <Text style={[styles.netPillLabel, styles.netPillLabelRed]}>You owe</Text>
            <Text style={[styles.netPillVal, styles.netPillValRed]}>{formatRs(youOwe)}</Text>
          </View>
        </View>
      </View>

      {/* Expenses Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My expenses</Text>
        <TouchableOpacity>
          <Text style={styles.sectionLink}>see all</Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabRow}>
        {allCategories.slice(0, 5).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the "+ Add Expense" button to add your first expense
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={renderExpenseItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Add Expense Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fabBtn}
          onPress={() => router.push({
            pathname: '/add-expense',
            params: { personName: personName, groupId: groupId }
          } as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabBtnText}>+ Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Long press hint */}
      <Text style={styles.longPressHint}>
        💡 Long press any expense to delete it
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  topBarName: {
    fontSize: 13,
    color: '#8E8E93',
  },
  personNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personName: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  personNameInput: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    padding: 0,
    margin: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#1D9E75',
    minWidth: 80,
  },
  groupNameText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 4,
  },
  editIcon: {
    fontSize: 12,
    color: '#1D9E75',
    marginLeft: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEEDFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3489',
  },
  netCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1D9E75',
    borderRadius: 14,
    padding: 16,
  },
  netLabel: {
    fontSize: 11,
    color: '#9FE1CB',
    marginBottom: 4,
  },
  netAmount: {
    fontSize: 28,
    fontWeight: '500',
    color: '#E1F5EE',
    marginBottom: 12,
  },
  netSubLabel: {
    fontSize: 10,
    color: '#9FE1CB',
    marginBottom: 12,
    marginTop: -8,
  },
  netRow: {
    flexDirection: 'row',
    gap: 10,
  },
  netPill: {
    flex: 1,
    backgroundColor: '#0F6E56',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  netPillLabel: {
    fontSize: 10,
    color: '#5DCAA5',
    marginBottom: 2,
  },
  netPillVal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E1F5EE',
  },
  netPillWhite: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  netPillLabelWhite: {
    color: '#8E8E93',
  },
  netPillValWhite: {
    color: '#1C1C1E',
  },
  netPillRed: {
    backgroundColor: '#FFEBEE',
  },
  netPillLabelRed: {
    color: '#D32F2F',
  },
  netPillValRed: {
    color: '#B71C1C',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  sectionLink: {
    fontSize: 11,
    color: '#1D9E75',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  tab: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  activeTab: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
  },
  tabText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#E1F5EE',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 120,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#E5E5EA',
    marginLeft: 64,
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
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  fabBtn: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  longPressHint: {
    textAlign: 'center',
    fontSize: 11,
    color: '#8E8E93',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 80,
  },
});