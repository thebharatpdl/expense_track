// app/(tabs)/index.tsx
import { deleteGroup, Group, GroupExpense, subscribeToGroupExpenses, subscribeToUserGroups } from '@/src/services/groupService'
import { subscribeToUserExpenses } from '@/src/services/userExpenseService'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { logout } from '@/src/store/slices/authSlice'
import { clearExpenses, setExpenses } from '@/src/store/slices/expenseSlice'
import { deleteGroup as deleteGroupAction, setGroups } from '@/src/store/slices/groupSlice'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width: screenWidth } = Dimensions.get('window')
const CATEGORY_TABS = ['All', 'Food', 'Transport', 'Utilities', 'Shopping']

type CombinedExpense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  type: 'personal' | 'group';
  groupName?: string;
  paidBy?: string;
}

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { monthlyLimit } = useAppSelector(state => state.budget);
  const { expenses: personalExpenses } = useAppSelector(state => state.expenses);
  const { groups } = useAppSelector(state => state.groups);
  
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([])
  const [allExpenses, setAllExpenses] = useState<CombinedExpense[]>([])
  const [activeTab, setActiveTab] = useState('All')
  
  const bottomSheetRef = useRef<BottomSheet>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Load personal expenses
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserExpenses(user.uid, (fetchedExpenses) => {
      dispatch(setExpenses(fetchedExpenses));
    });
    return () => unsubscribe();
  }, [user, dispatch]);

  // Load groups and their expenses
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserGroups(user.uid, (fetchedGroups) => {
      dispatch(setGroups(fetchedGroups));
      const unsubscribes: (() => void)[] = [];
      fetchedGroups.forEach(group => {
        const unsubscribeExpenses = subscribeToGroupExpenses(group.id, (expenses) => {
          setGroupExpenses(prev => {
            const otherGroups = prev.filter(e => e.groupId !== group.id);
            return [...otherGroups, ...expenses];
          });
        });
        unsubscribes.push(unsubscribeExpenses);
      });
      return () => {
        unsubscribes.forEach(unsub => unsub());
      };
    });
    return () => unsubscribe();
  }, [user, dispatch]);

  // Combine expenses
  useEffect(() => {
    const combined: CombinedExpense[] = [
      ...personalExpenses.map(exp => ({
        id: exp.id,
        title: exp.title,
        amount: exp.amount,
        category: exp.category,
        date: exp.date,
        description: exp.description,
        type: 'personal' as const,
      })),
      ...groupExpenses
        .filter(exp => exp.paidBy === user?.uid)
        .map(exp => ({
          id: exp.id,
          title: exp.title,
          amount: exp.amount,
          category: exp.category,
          date: exp.date,
          description: exp.description,
          type: 'group' as const,
          groupName: groups.find(g => g.id === exp.groupId)?.name,
          paidBy: exp.paidByName,
        })),
    ];
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllExpenses(combined);
  }, [personalExpenses, groupExpenses, groups, user]);

  const now = new Date()
  const monthly = allExpenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const total = monthly.reduce((sum, e) => sum + e.amount, 0)
  const remaining = monthlyLimit - total
  const percentage = monthlyLimit > 0 ? Math.min((total / monthlyLimit) * 100, 100) : 0
  const last4Expenses = allExpenses.slice(0, 4)
  const filteredExpenses = last4Expenses.filter(e => {
    if (activeTab === 'All') return true
    return e.category.toLowerCase() === activeTab.toLowerCase()
  })

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

  const getGroupBadgeStyle = (group: Group) => {
    if (group.totalExpenses === 0) return { bg: '#E2E8F0', text: '#64748B' }
    return { bg: '#DCFCE7', text: '#15803D' }
  }

  const getGroupBadgeLabel = (group: Group) => {
    if (group.totalExpenses === 0) return 'No expenses'
    return `₹${group.totalExpenses.toLocaleString()}`
  }

  const getGroupBarColor = (group: Group) => {
    if (group.totalExpenses === 0) return '#CBD5E1'
    return '#10B981'
  }

  const getMembersString = (group: Group) => {
    const names = group.members.map(m => m.name);
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} +${names.length - 3}`;
  }

  const deleteGroupCompletely = (groupId: string, groupName: string) => {
    Alert.alert(
      'Delete Group',
      `Delete "${groupName}" and all its expenses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroup(groupId);
              dispatch(deleteGroupAction(groupId));
              Alert.alert('Success', `"${groupName}" deleted`);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete group');
            }
          }
        }
      ]
    );
  };

  const handleOpenPress = () => bottomSheetRef.current?.expand()
  const handleClosePress = () => bottomSheetRef.current?.close()
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          handleClosePress();
          dispatch(clearExpenses());
          await dispatch(logout());
          router.replace('/login');
        }
      }
    ])
  }

  const goToFullExpenses = () => router.push('/all-expenses' as any)

  const renderExpenseItem = ({ item }: { item: CombinedExpense }) => (
    <View style={styles.expenseItem}>
      <View style={[styles.expIcon, { backgroundColor: getCategoryBgColor(item.category) }]}>
        <Text style={styles.expIconText}>{getCategoryIcon(item.category)}</Text>
      </View>
      <View style={styles.expInfo}>
        <Text style={styles.expName}>{item.title}</Text>
        <Text style={styles.expSub}>
          {getRelativeDate(item.date)} · {item.category}
          {item.type === 'group' && item.groupName && (
            <Text style={styles.groupTag}> · {item.groupName}</Text>
          )}
        </Text>
      </View>
      <Text style={[styles.expAmount, styles.amountRed]}>-₹{item.amount.toLocaleString()}</Text>
    </View>
  );

  const getRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      Food: '🍔', Transport: '🚗', Shopping: '🛒', Bills: '💡', Health: '💊', Other: '📦',
    };
    return icons[category] || '📝';
  };

  const getCategoryBgColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      Food: '#FAEEDA', Transport: '#E6F1FB', Shopping: '#FFE4E1',
      Bills: '#E0F7FA', Health: '#FCEBEB', Other: '#F2F2F7',
    };
    return colorMap[category] || '#F2F2F7';
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={['#1D9E75', '#16825E', '#0F6648']} style={styles.loginPromptContainer}>
          <View style={styles.loginPromptContent}>
            <Text style={styles.loginPromptEmoji}>👤</Text>
            <Text style={styles.loginPromptTitle}>Login to Continue</Text>
            <Text style={styles.loginPromptSubtitle}>Sign in to view your expenses and groups</Text>
            <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginPromptButton}>
              <Text style={styles.loginPromptButtonText}>Login / Sign Up</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Header Gradient */}
            <LinearGradient
              colors={['#1D9E75', '#16825E', '#0F6648']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <View style={styles.greetingRow}>
                <View>
                  <Text style={styles.greetingSmall}>
                    {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </Text>
                  <Text style={styles.greeting}>
                    👋 {getGreeting()}, {user?.displayName || 'User'}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleOpenPress} style={styles.avatarButton}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user?.displayName?.substring(0, 2).toUpperCase() || 'U'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Total Card */}
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total spent this month</Text>
                <Text style={styles.totalAmount}>₹ {total.toLocaleString()}</Text>
                {monthlyLimit > 0 && (
                  <View style={styles.budgetRow}>
                    <View style={styles.budgetBar}>
                      <View style={[styles.budgetFill, { width: `${percentage}%`, backgroundColor: getBudgetColor() }]} />
                    </View>
                    <Text style={styles.budgetText}>
                      {percentage.toFixed(0)}% of ₹{monthlyLimit.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Groups Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Groups</Text>
              <View style={styles.sectionActions}>
                <TouchableOpacity onPress={() => router.push('/join-group')} style={styles.actionButton}>
                  <Text style={styles.actionText}>Join</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/Group_creation')} style={styles.actionButton}>
                  <Text style={styles.actionText}>+ New</Text>
                </TouchableOpacity>
              </View>
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
                    onPress={() => router.push({ pathname: '/Group_expense', params: { groupId: group.id } } as any)}
                    onLongPress={() => deleteGroupCompletely(group.id, group.name)}
                    activeOpacity={0.8}
                    delayLongPress={500}
                  >
                    <View style={styles.groupCardHeader}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <View style={[styles.groupBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.groupBadgeText, { color: badge.text }]}>
                          {getGroupBadgeLabel(group)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.groupMembers}>{getMembersString(group)}</Text>
                    <View style={styles.groupProgress}>
                      <View style={styles.groupProgressBar}>
                        <View style={[styles.groupProgressFill, { width: `${Math.min((group.totalExpenses / 10000) * 100, 100)}%`, backgroundColor: getGroupBarColor(group) }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            {/* Expenses Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <TouchableOpacity onPress={goToFullExpenses}>
                <Text style={styles.seeAllLink}>See all</Text>
              </TouchableOpacity>
            </View>

            {/* Category Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
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
        renderItem={renderExpenseItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to add your first expense</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Floating Action Button */}
      {/* <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-expense' as any)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity> */}

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['50%']}
        enablePanDownToClose={true}
        onClose={() => setIsOpen(false)}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.profileAvatarContainer}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {user?.displayName?.substring(0, 2).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
          </View>
          <View style={styles.profileDivider} />
          <TouchableOpacity style={styles.profileMenuItem}>
            <Text style={styles.profileMenuIcon}>👤</Text>
            <Text style={styles.profileMenuText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileMenuItem}>
            <Text style={styles.profileMenuIcon}>⚙️</Text>
            <Text style={styles.profileMenuText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileMenuItem}>
            <Text style={styles.profileMenuIcon}>❓</Text>
            <Text style={styles.profileMenuText}>Help & Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileLogoutButton} onPress={handleLogout}>
            <Text style={styles.profileLogoutIcon}>🚪</Text>
            <Text style={styles.profileLogoutText}>Logout</Text>
          </TouchableOpacity>
          <Text style={styles.profileVersion}>Version 1.0.0</Text>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { paddingBottom: 100 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, marginBottom: 20 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingSmall: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500', letterSpacing: 0.3, marginBottom: 4 },
  greeting: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 0.2 },
  avatarButton: { padding: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Total Card
  totalCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 16 },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500', marginBottom: 4 },
  totalAmount: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -1, marginBottom: 12 },
  budgetRow: { marginTop: 8 },
  budgetBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  budgetFill: { height: 6, borderRadius: 3 },
  budgetText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, textAlign: 'right' },

  // Sections
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  sectionActions: { flexDirection: 'row', gap: 12 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 4 },
  actionText: { fontSize: 13, color: '#1D9E75', fontWeight: '600' },
  seeAllLink: { fontSize: 13, color: '#1D9E75', fontWeight: '600' },

  // Groups Scroll
  groupsScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 8, marginBottom: 8 },
  groupCard: { width: 200, backgroundColor: '#fff', borderRadius: 20, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  groupCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  groupName: { fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
  groupBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  groupBadgeText: { fontSize: 10, fontWeight: '700' },
  groupMembers: { fontSize: 11, color: '#64748B', marginBottom: 12 },
  groupProgress: { marginTop: 4 },
  groupProgressBar: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' },
  groupProgressFill: { height: 4, borderRadius: 2 },

  // Tabs
  tabsScroll: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  tabActive: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#fff' },

  // Expense Items
  expenseItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff' },
  separator: { height: 0.5, backgroundColor: '#E2E8F0', marginLeft: 68 },
  expIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  expIconText: { fontSize: 20 },
  expInfo: { flex: 1 },
  expName: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  expSub: { fontSize: 12, color: '#64748B' },
  groupTag: { color: '#1D9E75', fontWeight: '600' },
  expAmount: { fontSize: 15, fontWeight: '700' },
  amountRed: { color: '#EF4444' },

  // Empty State
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32, backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, marginTop: 20 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center' },

  // FAB
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '600' },

  // Login Prompt
  loginPromptContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginPromptContent: { alignItems: 'center', paddingHorizontal: 32 },
  loginPromptEmoji: { fontSize: 80, marginBottom: 24 },
  loginPromptTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 12 },
  loginPromptSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 32 },
  loginPromptButton: { backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  loginPromptButtonText: { color: '#1D9E75', fontSize: 16, fontWeight: '600' },

  // Bottom Sheet
  bottomSheetBackground: { backgroundColor: '#fff', borderRadius: 24 },
  bottomSheetHandle: { backgroundColor: '#CBD5E1', width: 40 },
  bottomSheetContent: { flex: 1, paddingHorizontal: 20, paddingBottom: 30 },
  profileAvatarContainer: { alignItems: 'center', marginTop: 20, marginBottom: 16 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', shadowColor: '#1D9E75', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  profileAvatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  profileInfo: { alignItems: 'center', marginBottom: 24 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#8E8E93' },
  profileDivider: { height: 1, backgroundColor: '#E8ECF0', marginVertical: 16 },
  profileMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  profileMenuIcon: { fontSize: 22, width: 32 },
  profileMenuText: { fontSize: 16, color: '#1C1C1E', fontWeight: '500' },
  profileLogoutButton: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingVertical: 14, gap: 12, backgroundColor: '#FEF2F2', borderRadius: 12, paddingHorizontal: 16 },
  profileLogoutIcon: { fontSize: 22, width: 32 },
  profileLogoutText: { fontSize: 16, color: '#EF4444', fontWeight: '600' },
  profileVersion: { textAlign: 'center', fontSize: 12, color: '#8E8E93', marginTop: 24 },
})