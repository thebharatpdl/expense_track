// src/services/expenseService.ts
import { db } from '@/src/config/firebase';
import {
    collection,
    deleteDoc,
    doc,
    DocumentData,
    increment // Add this import
    ,
    onSnapshot,
    orderBy,
    query,
    QuerySnapshot,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export interface GroupExpense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  category: string;
  paidBy: string;
  paidByName: string;
  splitAmong: string[];
  date: string;
  createdAt: string;
  description?: string;
}

// Add expense to group
export const addGroupExpense = async (
  groupId: string,
  expense: Omit<GroupExpense, 'id' | 'createdAt'>
): Promise<void> => {
  const expenseId = uuidv4();
  const newExpense: GroupExpense = {
    ...expense,
    id: expenseId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'groups', groupId, 'expenses', expenseId), newExpense);
  
  // Update group total expenses using increment
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    totalExpenses: increment(expense.amount)  // Fixed: Use increment directly
  });
};

// Get group expenses (real-time)
export const subscribeToGroupExpenses = (
  groupId: string,
  callback: (expenses: GroupExpense[]) => void
) => {
  const expensesRef = collection(db, 'groups', groupId, 'expenses');
  const q = query(expensesRef, orderBy('date', 'desc'));

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const expenses: GroupExpense[] = [];
    snapshot.forEach(doc => {
      expenses.push({ id: doc.id, ...doc.data() } as GroupExpense);
    });
    callback(expenses);
  });
};

// Delete expense
export const deleteGroupExpense = async (groupId: string, expenseId: string) => {
  await deleteDoc(doc(db, 'groups', groupId, 'expenses', expenseId));
};

// Update expense
export const updateGroupExpense = async (
  groupId: string,
  expenseId: string,
  updates: Partial<GroupExpense>
) => {
  await updateDoc(doc(db, 'groups', groupId, 'expenses', expenseId), updates);
};