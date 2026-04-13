import { useExpenseStore } from '@/src/store/expenseStore'
import { colors } from '@/src/theme/colors'
import { Category, Expense } from '@/src/types'
import DateTimePicker from '@react-native-community/datetimepicker'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const categories: Category[] = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Other']
const catIcons: Record<Category, string> = {
  Food: '🍔', Transport: '🚌', Shopping: '🛒',
  Bills: '💡', Health: '💊', Other: '📦',
}
const catColors: Record<Category, string> = {
  Food: '#F59E0B', Transport: '#3B82F6', Shopping: '#8B5CF6',
  Bills: '#10B981', Health: '#EF4444', Other: '#6B7280',
}

export default function EditExpenseScreen() {
  const { expense: expenseParam } = useLocalSearchParams()
  const expense: Expense = JSON.parse(expenseParam as string)
  const { editExpense } = useExpenseStore()

  const [title, setTitle] = useState(expense.title)
  const [amount, setAmount] = useState(String(expense.amount))
  const [category, setCategory] = useState<Category>(expense.category)
  const [date, setDate] = useState(new Date(expense.date))
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) setDate(selectedDate)
  }

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title')
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }
    editExpense(expense.id, {
      ...expense,
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      date: date.toISOString(),
    })
    router.back()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Header ── */}
          <LinearGradient
            colors={['#7C6FFF', '#4A44B5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.headerLabel}>EDITING</Text>
            <Text style={styles.headerTitle}>{expense.title}</Text>
            <View style={styles.headerMeta}>
              <Text style={styles.headerMetaText}>
                {catIcons[expense.category]} {expense.category}
              </Text>
              <Text style={styles.headerMetaDot}>·</Text>
              <Text style={styles.headerMetaText}>
                ₹{expense.amount.toLocaleString()}
              </Text>
            </View>
          </LinearGradient>

          {/* ── Form Card ── */}
          <View style={styles.formCard}>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✏️</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor={colors.subtext}
                  placeholder="Expense title"
                />
              </View>
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.amountBox}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholderTextColor={colors.subtext}
                  placeholder="0"
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoriesGrid}>
                {categories.map(cat => {
                  const isActive = category === cat
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryCard,
                        { borderColor: isActive ? catColors[cat] : '#E8ECF0' },
                        isActive && { backgroundColor: catColors[cat] + '12' },
                      ]}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.categoryIconWrap,
                        { backgroundColor: isActive ? catColors[cat] + '25' : '#F8FAFC' },
                      ]}>
                        <Text style={styles.categoryIcon}>{catIcons[cat]}</Text>
                      </View>
                      <Text style={[
                        styles.categoryText,
                        isActive && { color: catColors[cat], fontWeight: '700' },
                      ]}>
                        {cat}
                      </Text>
                      {isActive && (
                        <View style={[styles.activeDot, { backgroundColor: catColors[cat] }]} />
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dateIconWrap}>
                  <Text style={styles.dateIcon}>📅</Text>
                </View>
                <View style={styles.dateTextWrap}>
                  <Text style={styles.dateDayText}>
                    {date.toLocaleDateString('en-US', { weekday: 'long' })}
                  </Text>
                  <Text style={styles.dateFullText}>
                    {date.toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </Text>
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

          {/* ── Save Button ── */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#7C6FFF', '#4A44B5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveBtnIcon}>💾</Text>
              <Text style={styles.saveBtnText}>Update Expense</Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { paddingBottom: 48 },

  // ── Header ──
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: -20,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerMetaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  headerMetaDot: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
  },

  // ── Form Card ──
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0EEFF',
  },

  // ── Inputs ──
  inputGroup: { marginBottom: 22 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },

  // ── Amount ──
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    paddingVertical: 12,
  },

  // ── Categories ──
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    minWidth: '30%',
    flex: 1,
    gap: 8,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: { fontSize: 16 },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subtext,
    flex: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // ── Date ──
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    gap: 12,
  },
  dateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateIcon: { fontSize: 20 },
  dateTextWrap: { flex: 1 },
  dateDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  dateFullText: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 1,
  },
  dateChevron: {
    fontSize: 22,
    color: colors.subtext,
    opacity: 0.5,
  },

  // ── Save Button ──
  saveBtn: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  saveBtnIcon: { fontSize: 20 },
  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
})