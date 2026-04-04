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
}

export interface Budget {
  monthlyLimit: number
  month: string
}