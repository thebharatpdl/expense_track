// src/store/groupStore.ts
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandStorage } from './store'

export interface Group {
  id: string
  name: string
  members: string
  balance: number
  settled: boolean
  progress: number
}

interface GroupStore {
  groups: Group[]
  addGroup: (group: Group) => void
  updateGroup: (id: string, updates: Partial<Group>) => void
  deleteGroup: (id: string) => void
  getGroup: (id: string) => Group | undefined
}

const INITIAL_GROUPS: Group[] = []

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: INITIAL_GROUPS,

      addGroup: (group) =>
        set((state) => ({
          groups: [...state.groups, group],
        })),

      updateGroup: (id, updates) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),

      deleteGroup: (id) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
        })),

      getGroup: (id) => {
        const state = get()
        return state.groups.find((g) => g.id === id)
      },
    }),
    {
      name: 'group-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
)