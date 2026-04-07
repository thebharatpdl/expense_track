import { useExpenseStore } from '@/src/store/expenseStore'
import { colors } from '@/src/theme/colors'
import { Category } from '@/src/types'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useState } from 'react'
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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { v4 as uuidv4 } from 'uuid'

const categories: Category[] = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Other']
const catIcons: Record<Category, string> = {
  Food: '🍔', Transport: '🚌', Shopping: '🛒',
  Bills: '💡', Health: '💊', Other: '📦',
}
const catColors: Record<Category, string> = {
  Food: '#F59E0B', Transport: '#3B82F6', Shopping: '#8B5CF6',
  Bills: '#10B981', Health: '#EF4444', Other: '#6B7280',
}

const AddExpenseScreen = () => {
  const navigation = useNavigation()
  const { addExpense } = useExpenseStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('Food')
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) setDate(selectedDate)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title')
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      addExpense({
        id: uuidv4(),
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date: date.toISOString(),
        createdAt: new Date().toISOString(),
        description: undefined,
      })
      navigation.goBack()
    } catch (error) {
      Alert.alert('Error', 'Failed to save expense. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
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
            <Text style={styles.headerLabel}>NEW EXPENSE</Text>
            <Text style={styles.headerTitle}>Add Transaction</Text>
            <Text style={styles.headerSub}>Fill in the details below</Text>
          </LinearGradient>

          <View style={styles.formCard}>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✏️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Lunch at Café, Bus fare..."
                  placeholderTextColor={colors.subtext + '80'}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={50}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description
                <Text style={styles.optional}> (Optional)</Text>
              </Text>
              <TextInput
                style={[styles.inputWrapper, styles.textArea]}
                placeholder="Add additional details..."
                placeholderTextColor={colors.subtext + '80'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Amount <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.amountBox}>
                <LinearGradient
                  colors={[colors.primary + '18', colors.primary + '08']}
                  style={styles.amountGradient}
                >
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={colors.subtext + '60'}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </LinearGradient>
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
                        styles.categoryIconContainer,
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
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
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

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#7C6FFF', '#4A44B5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.saveButtonIcon}>💾</Text>
                  <Text style={styles.saveButtonText}>Save Expense</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.longPressHint}>
            💡 Long press any expense on home to delete it
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default AddExpenseScreen

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollView: { flex: 1 },
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
    marginBottom: 4,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
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
  required: { color: '#EF4444' },
  optional: { color: colors.subtext, fontWeight: '500' },
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
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    alignItems: 'flex-start',
    flexDirection: 'column',
  },

  // ── Amount ──
  amountBox: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  amountGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
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
    paddingVertical: 10,
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
  categoryIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: { fontSize: 18 },
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
  saveButton: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  saveButtonIcon: { fontSize: 20 },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  longPressHint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.subtext,
    paddingHorizontal: 32,
    lineHeight: 18,
  },
})