// src/services/userExpenseService.ts
import { db } from '@/src/config/firebase';
import { Category } from '@/src/types';
import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export interface UserExpense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  createdAt: string;
  description?: string;
  groupId?: string;
  paidBy?: string;
}

// Helper function to remove undefined values
const removeUndefined = (obj: any): any => {
  const result: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      result[key] = obj[key];
    }
  }
  return result;
};

// Add personal expense to Firestore
export const addUserExpense = async (
  userId: string,
  expense: Omit<UserExpense, 'id' | 'userId' | 'createdAt'>
): Promise<void> => {
  const expenseId = uuidv4();
  const newExpense: UserExpense = {
    ...expense,
    id: expenseId,
    userId: userId,
    createdAt: new Date().toISOString(),
  };
  
  // Remove any undefined values
  const cleanExpense = removeUndefined(newExpense);

  await setDoc(doc(db, 'users', userId, 'expenses', expenseId), cleanExpense);
};

// Get user's personal expenses (real-time)
export const subscribeToUserExpenses = (
  userId: string,
  callback: (expenses: UserExpense[]) => void
) => {
  const expensesRef = collection(db, 'users', userId, 'expenses');
  const q = query(expensesRef, orderBy('date', 'desc'));

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const expenses: UserExpense[] = [];
    snapshot.forEach(doc => {
      expenses.push({ id: doc.id, ...doc.data() } as UserExpense);
    });
    callback(expenses);
  });
};

// Delete personal expense
export const deleteUserExpense = async (userId: string, expenseId: string) => {
  await deleteDoc(doc(db, 'users', userId, 'expenses', expenseId));
};

// Update personal expense
export const updateUserExpense = async (
  userId: string,
  expenseId: string,
  updates: Partial<UserExpense>
) => {
  const cleanUpdates = removeUndefined(updates);
  await updateDoc(doc(db, 'users', userId, 'expenses', expenseId), cleanUpdates);
};

// Delete all expenses for a user
export const deleteAllUserExpenses = async (userId: string) => {
  const expensesRef = collection(db, 'users', userId, 'expenses');
  const snapshot = await getDocs(expensesRef);
  
  const deletePromises = snapshot.docs.map(doc => 
    deleteDoc(doc.ref)
  );
  
  await Promise.all(deletePromises);
};