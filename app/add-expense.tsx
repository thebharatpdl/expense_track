// app/add-expense.tsx
import { addGroupExpense } from '@/src/services/groupService';
import { addUserExpense } from '@/src/services/userExpenseService';
import { useAppSelector } from '@/src/store/hooks';
import { Category } from '@/src/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const categories: Category[] = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Other'];

const categoryIcons: Record<Category, string> = {
  Food: '🍔',
  Transport: '🚗',
  Shopping: '🛒',
  Bills: '💡',
  Health: '💊',
  Other: '📦',
};

const categoryColors: Record<Category, string> = {
  Food: '#F59E0B',
  Transport: '#3B82F6',
  Shopping: '#8B5CF6',
  Bills: '#10B981',
  Health: '#EF4444',
  Other: '#6B7280',
};

export default function AddExpenseScreen() {
  const { user } = useAppSelector(state => state.auth);
  const { groupId, personName } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setIsLoading(true);
    try {
      const expenseData: any = {
        title: title.trim(),
        amount: amountValue,
        category,
        date: date.toISOString(),
        paidBy: user.uid,
        paidByName: (personName as string) || user.displayName || 'You',
      };
      
      if (description.trim()) expenseData.description = description.trim();
      if (groupId) {
        expenseData.groupId = groupId as string;
        expenseData.splitAmong = [];
        await addGroupExpense(groupId as string, expenseData);
      } else {
        await addUserExpense(user.uid, expenseData);
      }
      
      Alert.alert(
        'Success',
        groupId ? 'Group expense added!' : 'Expense added!',
        [
          { text: 'Add Another', onPress: () => {
            setTitle(''); setDescription(''); setAmount('');
            setCategory('Food'); setDate(new Date());
          }},
          { text: 'Go Home', onPress: () => router.back() }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save expense');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#1D9E75" translucent={false} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Simplified Header */}
          <LinearGradient
            colors={['#1D9E75', '#16825E', '#0F6648']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Expense</Text>
            <View style={styles.headerRight} />
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>✏️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Lunch at Café"
                  placeholderTextColor="#94A3B8"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={50}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description <Text style={styles.optional}>(Optional)</Text></Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Add details..."
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount <Text style={styles.required}>*</Text></Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoriesGrid}>
                {categories.map(cat => {
                  const isActive = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryCard,
                        isActive && { backgroundColor: categoryColors[cat] + '20', borderColor: categoryColors[cat] }
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={styles.categoryIcon}>{categoryIcons[cat]}</Text>
                      <Text style={[styles.categoryText, isActive && { color: categoryColors[cat], fontWeight: '700' }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateIcon}>📅</Text>
                <View>
                  <Text style={styles.dateDay}>{date.toLocaleDateString('en-US', { weekday: 'long' })}</Text>
                  <Text style={styles.dateFull}>{date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                </View>
                <Text style={styles.dateChevron}>›</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#1D9E75', '#16825E', '#0F6648']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.saveIcon}>💰</Text>
                  <Text style={styles.saveText}>Save Expense</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerRight: { width: 40 },

  // Form Card
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 6 },
  required: { color: '#EF4444' },
  optional: { color: '#64748B', fontWeight: '400' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
  },
  inputIcon: { fontSize: 18, marginRight: 10, color: '#64748B' },
  input: { flex: 1, fontSize: 16, color: '#0F172A', paddingVertical: 12 },
  textAreaContainer: { alignItems: 'flex-start', paddingVertical: 10 },
  textArea: { flex: 1, fontSize: 16, color: '#0F172A', minHeight: 80, textAlignVertical: 'top' },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1D9E7530',
    paddingHorizontal: 16,
  },
  currencySymbol: { fontSize: 28, fontWeight: '800', color: '#1D9E75', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '800', color: '#0F172A', paddingVertical: 10 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  categoryIcon: { fontSize: 18 },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  dateIcon: { fontSize: 24, marginHorizontal: 4 },
  dateDay: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  dateFull: { fontSize: 12, color: '#64748B', marginTop: 2 },
  dateChevron: { fontSize: 22, color: '#64748B', marginLeft: 'auto' },

  // Save Button
  saveButton: { marginHorizontal: 16, marginTop: 8, borderRadius: 18, overflow: 'hidden', shadowColor: '#1D9E75', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  saveButtonDisabled: { opacity: 0.6 },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  saveIcon: { fontSize: 20 },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});