import { RootState } from '@/lib/store';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type LearnerModeState = {
  isInstructorMode: boolean;
};

// Not persisted: like the OS SPA, a reload puts an admin back in admin mode.
const initialState: LearnerModeState = {
  isInstructorMode: true,
};

const learnerModeSlice = createSlice({
  name: 'learnerMode',
  initialState,
  reducers: {
    setIsInstructorMode: (state, action: PayloadAction<boolean>) => {
      state.isInstructorMode = action.payload;
    },
  },
});

export const { setIsInstructorMode } = learnerModeSlice.actions;

export default learnerModeSlice;

export const selectIsInstructorMode = (state: RootState) => state.learnerMode.isInstructorMode;
