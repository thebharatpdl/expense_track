import { useBudgetStore } from '@/src/store/budgetStore'
import { useExpenseStore } from '@/src/store/expenseStore'
import { colors } from '@/src/theme/colors'
import { router } from 'expo-router'
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

const PRESETS = [5000, 10000, 15000, 20000, 30000, 50000]

export default function BudgetSettingsScreen() {
  const { monthlyLimit, setMonthlyLimit } = useBudgetStore()
  const { expenses } = useExpenseStore()

  const now = new Date()
  const monthlyExpenses = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const total = monthlyExpenses.reduce((s, e) => s + e.amount, 0)
  const pct = monthlyLimit > 0 ? Math.min((total / monthlyLimit) * 100, 100) : 0

  const [input, setInput] = useState(monthlyLimit > 0 ? String(monthlyLimit) : '')

  const getBudgetColor = () => {
    if (pct >= 100) return colors.expense
    if (pct >= 80) return colors.warning
    return colors.income
  }

  const handleSave = () => {
    const val = parseFloat(input)
    if (!val || val <= 0) {
      Alert.alert('Invalid amount', 'Please enter a budget greater than ₹0')
      return
    }
    setMonthlyLimit(val)
    Alert.alert(
      'Budget saved! 🎉',
      `Monthly budget set to ₹${val.toLocaleString()}`,
      [{ text: 'OK', onPress: () => router.back() }]
    )
  }

  const handleClear = () => {
    Alert.alert(
      'Clear Budget?',
      'This will remove your monthly budget limit.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMonthlyLimit(0)
            setInput('')
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Current Status Card */}
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>This month's usage</Text>

            <View style={styles.statusRow}>
              <View>
                <Text style={styles.statusSub}>Spent</Text>
                <Text style={styles.statusVal}>₹{total.toLocaleString()}</Text>
              </View>
              <View style={styles.statusDivider} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statusSub}>Budget limit</Text>
                <Text style={[styles.statusVal, { color: colors.primary }]}>
                  {monthlyLimit > 0 ? `₹${monthlyLimit.toLocaleString()}` : 'Not set'}
                </Text>
              </View>
            </View>

            {monthlyLimit > 0 && (
              <>
                <View style={styles.track}>
                  <View
                    style={[styles.fill, {
                      width: `${pct}%`,
                      backgroundColor: getBudgetColor(),
                    }]}
                  />
                </View>
                <View style={styles.pctRow}>
                  <Text style={[styles.pctText, { color: getBudgetColor() }]}>
                    {pct.toFixed(0)}% used
                  </Text>
                  <Text style={styles.remainText}>
                    {total <= monthlyLimit
                      ? `₹${(monthlyLimit - total).toLocaleString()} remaining`
                      : `₹${(total - monthlyLimit).toLocaleString()} over budget`}
                  </Text>
                </View>
              </>
            )}

            {monthlyLimit === 0 && (
              <View style={styles.notSetBanner}>
                <Text style={styles.notSetText}>
                  ⚠️ No budget set yet. Set one below to track your spending.
                </Text>
              </View>
            )}
          </View>

          {/* Input */}
          <Text style={styles.sectionLabel}>SET MONTHLY BUDGET</Text>
          <View style={styles.inputCard}>
            <View style={styles.inputRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={colors.subtext + '80'}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              {input.length > 0 && (
                <TouchableOpacity onPress={() => setInput('')} style={styles.clearInput}>
                  <Text style={styles.clearInputText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {input.length > 0 && parseFloat(input) > 0 && (
              <View style={styles.previewRow}>
                <Text style={styles.previewText}>
                  Daily limit → ₹{Math.round(parseFloat(input) / 30).toLocaleString()}
                </Text>
                <Text style={styles.previewText}>
                  Weekly limit → ₹{Math.round(parseFloat(input) / 4).toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Presets */}
          <Text style={styles.sectionLabel}>QUICK SELECT</Text>
          <View style={styles.presets}>
            {PRESETS.map((p) => {
              const isActive = input === String(p)
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.preset, isActive && styles.presetActive]}
                  onPress={() => setInput(String(p))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetAmount, isActive && styles.presetAmountActive]}>
                    ₹{(p / 1000).toFixed(0)}k
                  </Text>
                  <Text style={[styles.presetLabel, isActive && styles.presetLabelActive]}>
                    /month
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Tips */}
          <Text style={styles.sectionLabel}>TIPS</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipRow}>💡 Set budget 10% lower than your actual limit</Text>
            <Text style={styles.tipRow}>📅 Review your spending every Sunday</Text>
            <Text style={styles.tipRow}>🎯 Track daily to stay on target</Text>
            <Text style={styles.tipRow}>🔔 You'll see warnings at 80% and 100%</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, !input && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!input}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Save Budget</Text>
          </TouchableOpacity>

          {/* Clear Button */}
          {monthlyLimit > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Clear budget limit</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48 },

  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.subtext,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statusSub: { fontSize: 12, color: colors.subtext, marginBottom: 4 },
  statusVal: { fontSize: 22, fontWeight: '700', color: colors.text },
  track: {
    backgroundColor: '#eee',
    borderRadius: 99,
    height: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fill: { height: 10, borderRadius: 99 },
  pctRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pctText: { fontSize: 13, fontWeight: '600' },
  remainText: { fontSize: 12, color: colors.subtext },
  notSetBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  notSetText: { fontSize: 13, color: '#B45309', lineHeight: 20 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.subtext,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },

  inputCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  rupee: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: 16,
  },
  clearInput: { padding: 8 },
  clearInputText: { fontSize: 16, color: colors.subtext },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  previewText: { fontSize: 12, color: colors.primary, fontWeight: '500' },

  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  preset: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
  },
  presetActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  presetAmountActive: { color: '#fff' },
  presetLabel: { fontSize: 11, color: colors.subtext, marginTop: 2 },
  presetLabelActive: { color: 'rgba(255,255,255,0.8)' },

  tipCard: {
    backgroundColor: '#EDE9FF',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    marginBottom: 24,
  },
  tipRow: {
    fontSize: 13,
    color: '#534AB7',
    lineHeight: 20,
  },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  clearBtn: {
    padding: 14,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    color: colors.expense,
    fontWeight: '500',
  },
})