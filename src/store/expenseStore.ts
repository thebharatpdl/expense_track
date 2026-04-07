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
  getWeeklyTotals: () => number[]
  getTotalByCategory: () => Record<string, number>
  searchExpenses: (query: string) => Expense[]
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: [],

      addExpense: (expense) =>
        set((state) => ({ expenses: [expense, ...state.expenses] })),

      editExpense: (id, updated) =>
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
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

      getWeeklyTotals: () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()
        const weeks = [0, 0, 0, 0]
        get().expenses.forEach((e) => {
          const d = new Date(e.date)
          if (d.getMonth() === month && d.getFullYear() === year) {
            const week = Math.min(Math.floor((d.getDate() - 1) / 7), 3)
            weeks[week] += e.amount
          }
        })
        return weeks
      },

      getTotalByCategory: () => {
        const monthly = get().getMonthlyExpenses()
        return monthly.reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount
          return acc
        }, {} as Record<string, number>)
      },

      searchExpenses: (query: string) => {
        const q = query.toLowerCase()
        return get().expenses.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q) ||
            (e.description?.toLowerCase().includes(q) ?? false)
        )
      },
    }),
    {
      name: 'expense-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
)