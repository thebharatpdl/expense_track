import { EmptyState } from '@/components/EmptyState';
import { ExpenseCard } from '@/components/ExpenseCard';
import { useBudgetStore } from '@/src/store/budgetStore';
import { useExpenseStore } from '@/src/store/expenseStore';
import { colors } from '@/src/theme/colors';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { expenses, deleteExpense, getMonthlyExpenses } = useExpenseStore();
  const { monthlyLimit } = useBudgetStore();
  
  const monthly = getMonthlyExpenses();
  const total = monthly.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate budget progress
  const remaining = monthlyLimit - total;
  const percentage = (total / monthlyLimit) * 100;

  const confirmDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
    ]);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get budget status color
  const getBudgetColor = () => {
    if (percentage >= 100) return '#EF4444'; // Red - exceeded
    if (percentage >= 80) return '#F59E0B'; // Orange - warning
    return '#10B981'; // Green - good
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.primary, '#2D6A9F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingEmoji}>👋</Text>
              <Text style={styles.greeting}>{getGreeting()}</Text>
            </View>
            
            <View style={styles.monthChip}>
              <Text style={styles.month}>
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>
            </View>

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total spent this month</Text>
              <Text style={styles.totalAmount}>₹ {total.toLocaleString()}</Text>
            </View>

            {/* Budget Progress Bar */}
            <View style={styles.budgetContainer}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetLabel}>Monthly Budget</Text>
                <Text style={styles.budgetAmount}>
                  ₹ {total.toLocaleString()} / ₹ {monthlyLimit.toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: getBudgetColor()
                    }
                  ]} 
                />
              </View>
              
              <View style={styles.budgetFooter}>
                <Text style={[
                  styles.remainingText,
                  remaining < 0 && styles.exceededText
                ]}>
                  {remaining >= 0 
                    ? `₹ ${remaining.toLocaleString()} remaining` 
                    : `₹ ${Math.abs(remaining).toLocaleString()} over budget`}
                </Text>
                <TouchableOpacity 
                  style={styles.setBudgetButton}
                  onPress={() => navigation.navigate('BudgetSettings')}
                >
                  <Text style={styles.setBudgetText}>Set Budget</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>RECENT TRANSACTIONS</Text>
            <Text style={styles.expenseCount}>{expenses.length} items</Text>
          </View>
          
          <FlatList
            data={expenses}
            keyExtractor={e => e.id}
            renderItem={({ item }) => (
              <ExpenseCard
                expense={item}
                onPress={() => navigation.navigate('EditExpense', { expense: item })}
                onDelete={() => confirmDelete(item.id)}
              />
            )}
            ListEmptyComponent={<EmptyState />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  greetingEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  greeting: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  monthChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  month: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  totalContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalAmount: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  budgetContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.9,
  },
  budgetAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  exceededText: {
    color: '#FECACA',
    fontWeight: '600',
  },
  setBudgetButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  setBudgetText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.subtext,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  expenseCount: {
    fontSize: 12,
    color: colors.subtext,
    fontWeight: '500',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 12,
  },
});