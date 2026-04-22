// app/(tabs)/index.tsx
import { deleteGroup, Group, GroupExpense, subscribeToGroupExpenses, subscribeToUserGroups } from '@/src/services/groupService'
import { subscribeToUserExpenses } from '@/src/services/userExpenseService'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { logout } from '@/src/store/slice/authSlice'
import { clearExpenses, setExpenses } from '@/src/store/slice/expenseSlice'
import { deleteGroup as deleteGroupAction, setGroups } from '@/src/store/slice/groupSlice'
import { colors } from '@/src/theme/colors'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
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

// Combined expense type for display
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
  
  // Bottom sheet ref
  const bottomSheetRef = useRef<BottomSheet>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Load personal expenses from Firebase
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserExpenses(user.uid, (fetchedExpenses) => {
      dispatch(setExpenses(fetchedExpenses));
    });

    return () => unsubscribe();
  }, [user, dispatch]);

  // Load groups from Firebase
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserGroups(user.uid, (fetchedGroups) => {
      dispatch(setGroups(fetchedGroups));
      
      // Subscribe to expenses for each group
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

  // Combine personal and group expenses
  useEffect(() => {
    const combined: CombinedExpense[] = [
      // Personal expenses
      ...personalExpenses.map(exp => ({
        id: exp.id,
        title: exp.title,
        amount: exp.amount,
        category: exp.category,
        date: exp.date,
        description: exp.description,
        type: 'personal' as const,
      })),
      // Group expenses where user paid
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
    
    // Sort by date (newest first)
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllExpenses(combined);
  }, [personalExpenses, groupExpenses, groups, user]);

  const now = new Date()
  
  // Filter monthly expenses (only user's paid expenses)
  const monthly = allExpenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  // Total spent this month = user's personal + user's group expenses
  const total = monthly.reduce((sum, e) => sum + e.amount, 0)
  const remaining = monthlyLimit - total
  const percentage = monthlyLimit > 0 ? Math.min((total / monthlyLimit) * 100, 100) : 0

  // Get last 4 expenses for display
  const last4Expenses = allExpenses.slice(0, 4)

  // Filter expenses by category for display
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

  // Group helper functions
  const getGroupBadgeStyle = (group: Group) => {
    if (group.totalExpenses === 0) return { bg: '#F1F5F9', text: '#64748B' }
    return { bg: '#DCFCE7', text: '#15803D' }
  }

  const getGroupBadgeLabel = (group: Group) => {
    if (group.totalExpenses === 0) return 'No expenses'
    return `₹${group.totalExpenses.toLocaleString()}`
  }

  const getGroupBarColor = (group: Group) => {
    if (group.totalExpenses === 0) return '#94A3B8'
    return '#10B981'
  }

  // Format members string for display
  const getMembersString = (group: Group) => {
    const names = group.members.map(m => m.name);
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} +${names.length - 3}`;
  }

  // Function to delete group
  const deleteGroupCompletely = (groupId: string, groupName: string) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${groupName}"?\n\nThis will also delete ALL expenses in this group. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroup(groupId);
              dispatch(deleteGroupAction(groupId));
              Alert.alert('Success', `"${groupName}" and all its expenses have been deleted`);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete group');
            }
          }
        }
      ]
    );
  };

  // Bottom sheet methods
  const handleOpenPress = () => {
    bottomSheetRef.current?.expand()
    setIsOpen(true)
  }

  const handleClosePress = () => {
    bottomSheetRef.current?.close()
    setIsOpen(false)
  }

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
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
      ]
    )
  }

  // Navigate to full expenses screen
  const goToFullExpenses = () => {
    router.push('/all-expenses' as any)
  }

  // Render expense item
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
      <Text style={[styles.expAmount, styles.amountRed]}>- ₹{item.amount.toLocaleString()}</Text>
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
    const colorMap: Record<string, string> = {
      Food: '#FAEEDA',
      Transport: '#E6F1FB',
      Shopping: '#FFE4E1',
      Bills: '#E0F7FA',
      Health: '#FCEBEB',
      Other: '#F2F2F7',
    };
    return colorMap[category] || '#F2F2F7';
  };

  // If not logged in, show full screen login prompt
  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient
          colors={['#1D9E75', '#16825E', '#0F6648']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loginPromptContainer}
        >
          <View style={styles.loginPromptContent}>
            <Text style={styles.loginPromptEmoji}>👤</Text>
            <Text style={styles.loginPromptTitle}>Login to Continue</Text>
            <Text style={styles.loginPromptSubtitle}>
              Sign in to view your expenses and manage groups
            </Text>
            <TouchableOpacity 
              style={styles.loginPromptButton}
              onPress={() => router.push('/login')}
            >
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
            {/* ── Header ── */}
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

              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total spent this month</Text>
                <Text style={styles.totalAmount}>₹ {total.toLocaleString()}</Text>
              </View>
            </LinearGradient>

            {/* ── My Groups Section ── */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>MY GROUPS</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity onPress={() => router.push('/join-group')} style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/Group_creation')}>
                  <Text style={styles.sectionLink}>+ new</Text>
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
                        <Text style={styles.groupCardMembers}>{getMembersString(group)}</Text>
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
                          width: `${Math.min((group.totalExpenses / 10000) * 100, 100)}%`,
                          backgroundColor: getGroupBarColor(group),
                        },
                      ]} />
                    </View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            {/* ── Section Header with See All button ── */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>MY EXPENSES</Text>
              <TouchableOpacity onPress={goToFullExpenses}>
                <Text style={styles.seeAllLink}>see all</Text>
              </TouchableOpacity>
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
        renderItem={renderExpenseItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the "+ Add Expense" button to add your first expense
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Add Expense Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-expense' as any)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Bottom Sheet for Profile */}
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
  safe: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  listContent: {
    paddingBottom: 100,
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
  loginPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPromptContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loginPromptEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  joinButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  joinButtonText: {
    fontSize: 12,
    color: '#1D9E75',
    fontWeight: '600',
  },
  loginPromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  loginPromptSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginPromptButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginPromptButtonText: {
    color: '#1D9E75',
    fontSize: 16,
    fontWeight: '600',
  },
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
  avatarButton: {
    padding: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
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
  seeAllLink: {
    fontSize: 11,
    color: '#1D9E75',
    fontWeight: '600',
  },
  sectionLink: {
    fontSize: 12,
    color: '#1D9E75',
    fontWeight: '600',
  },
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
  groupTag: {
    color: '#1D9E75',
    fontWeight: '500',
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
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderRadius: 24,
  },
  bottomSheetHandle: {
    backgroundColor: '#CBD5E1',
    width: 40,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileAvatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D9E75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#E8ECF0',
    marginVertical: 16,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  profileMenuIcon: {
    fontSize: 22,
    width: 32,
  },
  profileMenuText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  profileLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  profileLogoutIcon: {
    fontSize: 22,
    width: 32,
  },
  profileLogoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  profileVersion: {
    textAlign: 'center',
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 24,
  },
});