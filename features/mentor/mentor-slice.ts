import { RootState } from '@/lib/store';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type MentorState = {
  spinnerHidden: boolean;
  agentReady: boolean;
};

const initialState: MentorState = {
  spinnerHidden: false,
  agentReady: false,
};

const mentorSlice = createSlice({
  name: 'mentor',
  initialState,
  reducers: {
    setMentorSpinnerHidden: (state, action: PayloadAction<boolean>) => {
      state.spinnerHidden = action.payload;
    },
    setMentorAgentReady: (state, action: PayloadAction<boolean>) => {
      state.agentReady = action.payload;
    },
  },
});

export const { setMentorSpinnerHidden, setMentorAgentReady } = mentorSlice.actions;

export default mentorSlice;

export const selectMentorSpinnerHidden = (state: RootState) => state.mentor.spinnerHidden;
export const selectMentorAgentReady = (state: RootState) => state.mentor.agentReady;
