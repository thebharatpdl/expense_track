import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BudgetState {
  monthlyLimit: number;
}

const initialState: BudgetState = {
  monthlyLimit: 0,
};

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    setMonthlyLimit: (state, action: PayloadAction<number>) => {
      state.monthlyLimit = action.payload;
    },
  },
});

export const { setMonthlyLimit } = budgetSlice.actions;
export default budgetSlice.reducer;