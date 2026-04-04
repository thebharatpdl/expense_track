import { useExpenseStore } from '@/src/store/expenseStore'
import { colors } from '@/src/theme/colors'
import { Category } from '@/src/types'
import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native'
import { v4 as uuidv4 } from 'uuid'
import DateTimePicker from '@react-native-community/datetimepicker'

const categories: Category[] = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Other']
const catIcons: Record<Category, string> = {
    Food: '🍔', Transport: '🚌', Shopping: '🛒',
    Bills: '💡', Health: '💊', Other: '📦',
}

const catColors: Record<Category, string> = {
    Food: '#F59E0B',
    Transport: '#3B82F6',
    Shopping: '#8B5CF6',
    Bills: '#10B981',
    Health: '#EF4444',
    Other: '#6B7280',
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
        if (selectedDate) {
            setDate(selectedDate)
        }
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
            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 500))
            
            addExpense({
                id: uuidv4(),
                title: title.trim(),
                amount: parseFloat(amount),
                category,
                date: date.toISOString(),
                createdAt: new Date().toISOString(),
            })
            
            navigation.goBack()
        } catch (error) {
            Alert.alert('Error', 'Failed to save expense. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Add New Expense</Text>
                    <Text style={styles.headerSubtitle}>Track your spending easily</Text>
                </View>

                {/* Title Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                        Title <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Lunch at Café, Bus fare..."
                        placeholderTextColor={colors.subtext + '80'}
                        value={title}
                        onChangeText={setTitle}
                        maxLength={50}
                    />
                </View>

                {/* Description Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Add additional details..."
                        placeholderTextColor={colors.subtext + '80'}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                {/* Amount Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                        Amount (₹) <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.amountInputContainer}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0"
                            placeholderTextColor={colors.subtext + '80'}
                            keyboardType="decimal-pad"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>
                </View>

                {/* Category Selection */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Category</Text>
                    <View style={styles.categoriesGrid}>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryCard,
                                    category === cat && styles.categoryCardActive,
                                    { borderColor: catColors[cat] + '40' }
                                ]}
                                onPress={() => setCategory(cat)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.categoryIconContainer,
                                    category === cat && { backgroundColor: catColors[cat] + '20' }
                                ]}>
                                    <Text style={styles.categoryIcon}>{catIcons[cat]}</Text>
                                </View>
                                <Text style={[
                                    styles.categoryText,
                                    category === cat && styles.categoryTextActive
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Date Picker */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity 
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.dateIcon}>📅</Text>
                        <Text style={styles.dateText}>
                            {date.toLocaleDateString('en-US', { 
                                weekday: 'long',
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </Text>
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

                {/* Save Button */}
                <TouchableOpacity 
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.saveButtonIcon}>💾</Text>
                            <Text style={styles.saveButtonText}>Save Expense</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

export default AddExpenseScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.subtext,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    required: {
        color: '#EF4444',
    },
    input: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: {
        minHeight: 80,
        paddingTop: 12,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.primary,
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        minWidth: '30%',
        flex: 1,
    },
    categoryCardActive: {
        backgroundColor: colors.primary + '10',
        borderWidth: 2,
    },
    categoryIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    categoryIcon: {
        fontSize: 18,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    categoryTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dateIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    dateText: {
        fontSize: 15,
        color: colors.text,
        flex: 1,
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonIcon: {
        fontSize: 18,
        marginRight: 8,
        color: '#fff',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})