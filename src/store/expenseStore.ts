import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Expense } from '../types'
import { zustandStorage } from './store'

interface ExpenseStore {
  expenses: Expense[]
  addExpense: (expense: Expense) => void
  editExpense: (id: string, updated: Expense) => void
  deleteExpense: (id: string) => void
  getMonthlyExpenses: () => Expense[]
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: [],

      addExpense: (expense) =>
        set((state) => ({
          expenses: [expense, ...state.expenses],
        })),

      editExpense: (id, updated) =>
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? updated : e
          ),
        })),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

      getMonthlyExpenses: () => {
        const now = new Date()
        return get().expenses.filter((e) => {
          const d = new Date(e.date)
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          )
        })
      },
    }),
    {
      name: 'expense-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
)