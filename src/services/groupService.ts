// src/services/groupService.ts
import { db } from '@/src/config/firebase';
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDocs,
  onSnapshot,
  query,
  QuerySnapshot,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';

// Custom UUID generator for React Native (no external dependencies)
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface GroupMember {
  uid: string;
  name: string;
  email: string;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  members: GroupMember[];
  memberUids: string[];
  createdBy: string;
  createdAt: string;
  totalExpenses: number;
  active?: boolean;
  deletedAt?: string;
}

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

// Generate a random 6-character invite code
const generateInviteCode = (): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Create a new group in Firestore
export const createGroup = async (
  groupName: string,
  createdBy: string,
  userName: string,
  userEmail: string
): Promise<Group> => {
  const groupId = generateUUID();
  const inviteCode = generateInviteCode();
  const now = new Date().toISOString();

  const newGroup: Group = {
    id: groupId,
    name: groupName,
    inviteCode: inviteCode,
    members: [{
      uid: createdBy,
      name: userName,
      email: userEmail,
      joinedAt: now
    }],
    memberUids: [createdBy],
    createdBy: createdBy,
    createdAt: now,
    totalExpenses: 0,
    active: true,
  };

  await setDoc(doc(db, 'groups', groupId), newGroup);
  return newGroup;
};

// Join a group using invite code
export const joinGroup = async (
  inviteCode: string,
  userUid: string,
  userName: string,
  userEmail: string
): Promise<Group | null> => {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('inviteCode', '==', inviteCode.toUpperCase()));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('Invalid invite code');
  }

  const groupDoc = querySnapshot.docs[0];
  const group = groupDoc.data() as Group;

  // Check if user already in group
  if (group.members.some(m => m.uid === userUid)) {
    throw new Error('You are already a member of this group');
  }

  const newMember: GroupMember = {
    uid: userUid,
    name: userName,
    email: userEmail,
    joinedAt: new Date().toISOString()
  };

  await updateDoc(doc(db, 'groups', group.id), {
    members: arrayUnion(newMember),
    memberUids: arrayUnion(userUid)
  });

  return { ...group, id: groupDoc.id };
};

// Get user's groups (real-time listener)
export const subscribeToUserGroups = (
  userUid: string,
  callback: (groups: Group[]) => void
) => {
  const groupsRef = collection(db, 'groups');
  // Query using memberUids array for server-side filtering
  const q = query(groupsRef, where('memberUids', 'array-contains', userUid));
  
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const groups: Group[] = [];
    snapshot.forEach(doc => {
      const group = { id: doc.id, ...doc.data() } as Group;
      // Only show active groups
      if (group.active !== false) {
        groups.push(group);
      }
    });
    callback(groups);
  });
};

// Get group by ID (real-time)
export const subscribeToGroup = (
  groupId: string,
  callback: (group: Group | null) => void
) => {
  const groupRef = doc(db, 'groups', groupId);
  return onSnapshot(groupRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Group);
    } else {
      callback(null);
    }
  });
};

// Update group
export const updateGroup = async (groupId: string, updates: Partial<Group>): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, updates);
};

// Delete group with all expenses
export const deleteGroupCompletely = async (groupId: string): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  
  // Get all expenses in the group
  const expensesRef = collection(db, 'groups', groupId, 'expenses');
  const expensesSnapshot = await getDocs(expensesRef);
  
  // Delete each expense
  const deletePromises = expensesSnapshot.docs.map(expenseDoc => 
    deleteDoc(doc(db, 'groups', groupId, 'expenses', expenseDoc.id))
  );
  
  // Wait for all expenses to be deleted
  await Promise.all(deletePromises);
  
  // Finally delete the group document
  await deleteDoc(groupRef);
};

// Soft delete (mark as inactive without removing data)
export const softDeleteGroup = async (groupId: string): Promise<void> => {
  await updateDoc(doc(db, 'groups', groupId), {
    active: false,
    deletedAt: new Date().toISOString()
  });
};

// Main delete function - use this for complete deletion
export const deleteGroup = async (groupId: string): Promise<void> => {
  await deleteGroupCompletely(groupId);
};

// Add expense to group
export const addGroupExpense = async (
  groupId: string,
  expense: Omit<GroupExpense, 'id' | 'createdAt'>
): Promise<void> => {
  const expenseId = generateUUID();
  const newExpense: GroupExpense = {
    ...expense,
    id: expenseId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'groups', groupId, 'expenses', expenseId), newExpense);
};

// Get group expenses (real-time)
export const subscribeToGroupExpenses = (
  groupId: string,
  callback: (expenses: GroupExpense[]) => void
) => {
  const expensesRef = collection(db, 'groups', groupId, 'expenses');
  const q = query(expensesRef);

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const expenses: GroupExpense[] = [];
    snapshot.forEach(doc => {
      expenses.push({ id: doc.id, ...doc.data() } as GroupExpense);
    });
    callback(expenses);
  });
};

// Delete single expense from group
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