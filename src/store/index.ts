import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slice/authSlice';
import budgetReducer from '../store/slice/budgetSlice';
import expenseReducer from '../store/slice/expenseSlice';
import groupReducer from '../store/slice/groupSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    expenses: expenseReducer,
    groups: groupReducer,
    budget: budgetReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // For Firebase User object
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;