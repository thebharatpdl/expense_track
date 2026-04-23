import { addUserExpense, deleteUserExpense, UserExpense } from '@/src/services/userExpenseService';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ExpenseState {
  expenses: UserExpense[];
  loading: boolean;
  error: string | null;
}

const initialState: ExpenseState = {
  expenses: [],
  loading: false,
  error: null,
};

export const fetchExpenses = createAsyncThunk(
  'expenses/fetch',
  async (userId: string) => {
    // This will be handled by the real-time listener
    return [];
  }
);

export const addExpense = createAsyncThunk(
  'expenses/add',
  async ({ userId, expense }: { userId: string; expense: any }) => {
    await addUserExpense(userId, expense);
    return expense;
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/delete',
  async ({ userId, expenseId }: { userId: string; expenseId: string }) => {
    await deleteUserExpense(userId, expenseId);
    return expenseId;
  }
);

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setExpenses: (state, action: PayloadAction<UserExpense[]>) => {
      state.expenses = action.payload;
    },
    clearExpenses: (state) => {
      state.expenses = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addExpense.pending, (state) => {
        state.loading = true;
      })
      .addCase(addExpense.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(e => e.id !== action.payload);
      });
  },
});

export const { setExpenses, clearExpenses } = expenseSlice.actions;
export default expenseSlice.reducer;