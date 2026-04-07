import { useNavigation, useRoute } from '@react-navigation/native'
import React, { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native'
import { useExpenseStore } from '../src/store/expenseStore'
import { colors } from '../src/theme/colors'
import { Category, Expense } from '../src/types'

const categories: Category[] = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Other']
const catIcons: Record<Category, string> = {
  Food: '🍔', Transport: '🚌', Shopping: '🛒',
  Bills: '💡', Health: '💊', Other: '📦',
}

export const EditExpenseScreen = () => {
  const navigation = useNavigation()
  const route = useRoute<any>()
  const { expense }: { expense: Expense } = route.params
  const { editExpense } = useExpenseStore()

  const [title, setTitle] = useState(expense.title)
  const [amount, setAmount] = useState(String(expense.amount))
  const [category, setCategory] = useState<Category>(expense.category)

  const handleSave = () => {
    editExpense(expense.id, {
      ...expense,
      title: title.trim(),
      amount: parseFloat(amount),
      category,
    })
    navigation.goBack()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={colors.subtext} />

      <Text style={styles.label}>Amount (Rs.)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} placeholderTextColor={colors.subtext} />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categories}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catBtn, category === cat && styles.catBtnActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={styles.catIcon}>{catIcons[cat]}</Text>
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Update Expense</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  label: { fontSize: 13, fontWeight: '500', color: colors.subtext, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: 14, fontSize: 15, color: colors.text,
    borderWidth: 0.5, borderColor: colors.border,
  },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border,
  },
  catBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catIcon: { fontSize: 14 },
  catText: { fontSize: 13, color: colors.text },
  catTextActive: { color: '#fff', fontWeight: '500' },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 32,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
})
