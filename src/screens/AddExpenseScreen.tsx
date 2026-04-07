// import { useNavigation } from '@react-navigation/native'
// import React, { useState } from 'react'
// import {
//     Alert,
//     ScrollView,
//     StyleSheet,
//     Text, TextInput, TouchableOpacity,
//     View
// } from 'react-native'
// import 'react-native-get-random-values'
// import { v4 as uuidv4 } from 'uuid'
// import { useExpenseStore } from '../store/expenseStore'
// import { colors } from '../theme/colors'
// import { Category } from '../types'

// const categories: Category[] = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Other']
// const catIcons: Record<Category, string> = {
//   Food: '🍔', Transport: '🚌', Shopping: '🛒',
//   Bills: '💡', Health: '💊', Other: '📦',
// }

// export const AddExpenseScreen = () => {
//   const navigation = useNavigation()
//   const { addExpense } = useExpenseStore()
//   const [title, setTitle] = useState('')
//   const [amount, setAmount] = useState('')
//   const [category, setCategory] = useState<Category>('Food')
//   const [date, setDate] = useState(new Date().toISOString())

//   const handleSave = () => {
//     if (!title.trim() || !amount) {
//       Alert.alert('Error', 'Please fill in all fields')
//       return
//     }
//     addExpense({
//       id: uuidv4(),
//       title: title.trim(),
//       amount: parseFloat(amount),
//       category,
//       date,
//       createdAt: new Date().toISOString(),
//     })
//     navigation.goBack()
//   }

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.content}>
//       <Text style={styles.label}>Title</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="e.g. Lunch, Bus fare..."
//         value={title}
//         onChangeText={setTitle}
//         placeholderTextColor={colors.subtext}
//       />


// <Text style={styles.label}>Description</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="e.g. Lunch, Bus fare..."
//         value={title}
//         onChangeText={setTitle}
//         placeholderTextColor={colors.subtext}
//       />




//       <Text style={styles.label}>Amount (Rs.)</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="0"
//         keyboardType="numeric"
//         value={amount}
//         onChangeText={setAmount}
//         placeholderTextColor={colors.subtext}
//       />

//       <Text style={styles.label}>Category</Text>
//       <View style={styles.categories}>
//         {categories.map(cat => (
//           <TouchableOpacity
//             key={cat}
//             style={[styles.catBtn, category === cat && styles.catBtnActive]}
//             onPress={() => setCategory(cat)}
//           >
//             <Text style={styles.catIcon}>{catIcons[cat]}</Text>
//             <Text style={[styles.catText, category === cat && styles.catTextActive]}>
//               {cat}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
//         <Text style={styles.saveBtnText}>Save Expense</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   )
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: colors.background },
//   content: { padding: 20 },
//   label: {
//     fontSize: 13,
//     fontWeight: '500',
//     color: colors.subtext,
//     marginBottom: 6,
//     marginTop: 16,
//     letterSpacing: 0.3,
//   },
//   input: {
//     backgroundColor: colors.card,
//     borderRadius: 12,
//     padding: 14,
//     fontSize: 15,
//     color: colors.text,
//     borderWidth: 0.5,
//     borderColor: colors.border,
//   },
//   categories: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginTop: 4,
//   },
//   catBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: colors.card,
//     borderWidth: 0.5,
//     borderColor: colors.border,
//   },
//   catBtnActive: {
//     backgroundColor: colors.primary,
//     borderColor: colors.primary,
//   },
//   catIcon: { fontSize: 14 },
//   catText: { fontSize: 13, color: colors.text },
//   catTextActive: { color: '#fff', fontWeight: '500' },
//   saveBtn: {
//     backgroundColor: colors.primary,
//     borderRadius: 14,
//     padding: 16,
//     alignItems: 'center',
//     marginTop: 32,
//   },
//   saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
// })