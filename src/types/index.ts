// src/types/index.ts
export type Category =
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Bills'
  | 'Health'
  | 'Other'

export interface Expense {
  id: string
  title: string
  amount: number
  category: Category
  date: string
  createdAt: string
  description?: string
  groupId?: string  // Made optional
  paidBy?: string  // Who paid for this expense
}

export interface Budget {
  monthlyLimit: number
  month: string
}