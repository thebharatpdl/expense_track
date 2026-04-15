// src/store/authStore.ts
import { auth } from '@/src/config/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User
} from 'firebase/auth';
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  loading: boolean;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  register: async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    set({ user: userCredential.user });
  },

  login: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    set({ user: userCredential.user });
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },
}));

// Listen to auth state changes - ADDED TYPE FOR 'user'
auth.onAuthStateChanged((user: User | null) => {
  useAuthStore.setState({ user, loading: false });
});