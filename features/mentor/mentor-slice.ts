import { RootState } from '@/lib/store';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type MentorState = {
  spinnerHidden: boolean;
};

const initialState: MentorState = {
  spinnerHidden: false,
};

const mentorSlice = createSlice({
  name: 'mentor',
  initialState,
  reducers: {
    setMentorSpinnerHidden: (state, action: PayloadAction<boolean>) => {
      state.spinnerHidden = action.payload;
    },
  },
});

export const { setMentorSpinnerHidden } = mentorSlice.actions;

export default mentorSlice;

export const selectMentorSpinnerHidden = (state: RootState) => state.mentor.spinnerHidden;
