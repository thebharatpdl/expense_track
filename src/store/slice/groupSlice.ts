import { Group } from '@/src/services/groupService';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GroupState {
  groups: Group[];
  loading: boolean;
}

const initialState: GroupState = {
  groups: [],
  loading: false,
};

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setGroups: (state, action: PayloadAction<Group[]>) => {
      state.groups = action.payload;
    },
    addGroup: (state, action: PayloadAction<Group>) => {
      state.groups.push(action.payload);
    },
    updateGroup: (state, action: PayloadAction<{ id: string; updates: Partial<Group> }>) => {
      const index = state.groups.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.groups[index] = { ...state.groups[index], ...action.payload.updates };
      }
    },
    deleteGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter(g => g.id !== action.payload);
    },
  },
});

export const { setGroups, addGroup, updateGroup, deleteGroup } = groupSlice.actions;
export default groupSlice.reducer;