import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandStorage } from './store'

interface BudgetStore {
  monthlyLimit: number
  setMonthlyLimit: (limit: number) => void
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set) => ({
      monthlyLimit: 15000,

      setMonthlyLimit: (limit) =>
        set({ monthlyLimit: limit }),
    }),
    {
      name: 'budget-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
)