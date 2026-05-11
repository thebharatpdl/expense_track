// src/store/slices/authSlice.ts
import { auth } from '@/src/config/firebase';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  emailVerified: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  emailVerified: false,
};

export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password, name }: { email: string; password: string; name: string }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    // Send verification email after registration
    await sendEmailVerification(userCredential.user);
    return userCredential.user;
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await signOut(auth);
  return null;
});

export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerification',
  async (_, { rejectWithValue }) => {
    try {
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
      }
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resend');
    }
  }
);

export const checkEmailVerification = createAsyncThunk(
  'auth/checkVerification',
  async (_, { rejectWithValue }) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        return user.emailVerified;
      }
      return false;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check verification');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.emailVerified = action.payload?.emailVerified || false;
      state.loading = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.emailVerified = false;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    updateEmailVerified: (state, action: PayloadAction<boolean>) => {
      state.emailVerified = action.payload;
      if (state.user) {
        state.user.emailVerified = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.emailVerified = action.payload.emailVerified;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
        state.isAuthenticated = false;
        state.emailVerified = false;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.emailVerified = action.payload.emailVerified;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
        state.isAuthenticated = false;
        state.emailVerified = false;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.emailVerified = false;
        state.loading = false;
      })
      // Check email verification
      .addCase(checkEmailVerification.fulfilled, (state, action) => {
        state.emailVerified = action.payload;
        if (state.user) {
          state.user.emailVerified = action.payload;
        }
      });
  },
});

export const { setUser, clearUser, clearError, setLoading, updateEmailVerified } = authSlice.actions;
export default authSlice.reducer;