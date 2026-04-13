import { useBudgetStore } from '@/src/store/budgetStore'
import { useExpenseStore } from '@/src/store/expenseStore'
import { colors } from '@/src/theme/colors'
import { LinearGradient } from 'expo-linear-gradient'
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
          {/* ── Status Card ── */}
          <LinearGradient
            colors={['#7C6FFF', '#4A44B5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusCard}
          >
            <Text style={styles.statusLabel}>THIS MONTH'S USAGE</Text>

            <View style={styles.statusRow}>
              <View>
                <Text style={styles.statusSub}>Spent</Text>
                <Text style={styles.statusVal}>₹{total.toLocaleString()}</Text>
              </View>
              <View style={styles.statusDivider} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statusSub}>Budget limit</Text>
                <Text style={[styles.statusVal, { color: '#86EFAC' }]}>
                  {monthlyLimit > 0 ? `₹${monthlyLimit.toLocaleString()}` : 'Not set'}
                </Text>
              </View>
            </View>

            {monthlyLimit > 0 && (
              <>
                <View style={styles.track}>
                  <View style={[styles.fill, {
                    width: `${pct}%`,
                    backgroundColor: getBudgetColor(),
                  }]} />
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
                  ⚠️  No budget set yet. Set one below to start tracking.
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* ── Input ── */}
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
                placeholderTextColor={colors.subtext + '60'}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              {input.length > 0 && (
                <TouchableOpacity
                  onPress={() => setInput('')}
                  style={styles.clearInputBtn}
                >
                  <Text style={styles.clearInputText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {input.length > 0 && parseFloat(input) > 0 && (
              <View style={styles.previewRow}>
                <View style={styles.previewChip}>
                  <Text style={styles.previewLabel}>Daily</Text>
                  <Text style={styles.previewVal}>
                    ₹{Math.round(parseFloat(input) / 30).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.previewDivider} />
                <View style={styles.previewChip}>
                  <Text style={styles.previewLabel}>Weekly</Text>
                  <Text style={styles.previewVal}>
                    ₹{Math.round(parseFloat(input) / 4).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.previewDivider} />
                <View style={styles.previewChip}>
                  <Text style={styles.previewLabel}>Monthly</Text>
                  <Text style={styles.previewVal}>
                    ₹{Math.round(parseFloat(input)).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ── Presets ── */}
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
                  {isActive && (
                    <Text style={styles.presetCheck}>✓</Text>
                  )}
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

          {/* ── Tips ── */}
          <Text style={styles.sectionLabel}>TIPS</Text>
          <View style={styles.tipCard}>
            {[
              { icon: '💡', text: 'Set budget 10% lower than your actual limit' },
              { icon: '📅', text: 'Review your spending every Sunday' },
              { icon: '🎯', text: 'Track daily to stay on target' },
              { icon: '🔔', text: "You'll see warnings at 80% and 100%" },
            ].map((tip, i) => (
              <View key={i} style={[styles.tipRow, i < 3 && styles.tipRowBorder]}>
                <Text style={styles.tipIcon}>{tip.icon}</Text>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>

          {/* ── Save Button ── */}
          <TouchableOpacity
            style={[styles.saveBtn, !input && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!input}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#7C6FFF', '#4A44B5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveBtnText}>Save Budget</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Clear Button ── */}
          {monthlyLimit > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>🗑  Clear budget limit</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 16, paddingBottom: 48 },

  // ── Status Card ──
  statusCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 18,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  statusSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 5,
    fontWeight: '500',
  },
  statusVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  track: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 99,
    height: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: { height: 10, borderRadius: 99 },
  pctRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pctText: { fontSize: 13, fontWeight: '700' },
  remainText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  notSetBanner: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  notSetText: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 20,
    fontWeight: '500',
  },

  // ── Section Label ──
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.subtext,
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 4,
  },

  // ── Input Card ──
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    marginBottom: 28,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  rupee: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primary,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    paddingVertical: 16,
  },
  clearInputBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearInputText: {
    fontSize: 12,
    color: colors.subtext,
    fontWeight: '700',
  },
  previewRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  previewChip: {
    flex: 1,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 10,
    color: colors.subtext,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  previewVal: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '800',
  },
  previewDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },

  // ── Presets ──
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  presetActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  presetCheck: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    marginBottom: 2,
  },
  presetAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  presetAmountActive: { color: '#fff' },
  presetLabel: {
    fontSize: 10,
    color: colors.subtext,
    marginTop: 3,
    fontWeight: '600',
  },
  presetLabelActive: { color: 'rgba(255,255,255,0.75)' },

  // ── Tips ──
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  tipRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tipIcon: { fontSize: 18 },
  tipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },

  // ── Save Button ──
  saveBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Clear Button ──
  clearBtn: {
    padding: 14,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    color: colors.expense,
    fontWeight: '600',
  },
})