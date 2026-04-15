// src/store/expenseStore.ts
import { Expense } from '@/src/types'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandStorage } from './store'

interface ExpenseStore {
  expenses: Expense[]
  addExpense: (expense: Expense) => void
  updateExpense: (id: string, updates: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  deleteExpensesByGroup: (groupId: string) => void  // Add this
  getExpensesByGroup: (groupId: string) => Expense[]
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: [],

      addExpense: (expense) =>
        set((state) => ({
          expenses: [...state.expenses, expense],
        })),

      updateExpense: (id, updates) =>
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

      // Add this function - it filters out all expenses with matching groupId
      deleteExpensesByGroup: (groupId) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.groupId !== groupId),
        })),

      getExpensesByGroup: (groupId) => {
        const state = get()
        return state.expenses.filter((e) => e.groupId === groupId)
      },
    }),
    {
      name: 'expense-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
)