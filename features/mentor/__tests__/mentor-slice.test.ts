import { describe, it, expect } from 'vitest';
import mentorSlice, {
  setMentorAgentReady,
  setMentorSpinnerHidden,
  selectMentorAgentReady,
  selectMentorSpinnerHidden,
} from '../mentor-slice';

describe('mentorSlice', () => {
  it('starts with spinnerHidden=false and agentReady=false', () => {
    const state = mentorSlice.reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({ spinnerHidden: false, agentReady: false });
  });

  it('toggles agentReady via setMentorAgentReady', () => {
    const ready = mentorSlice.reducer(
      { spinnerHidden: false, agentReady: false },
      setMentorAgentReady(true),
    );
    expect(ready.agentReady).toBe(true);
    expect(mentorSlice.reducer(ready, setMentorAgentReady(false)).agentReady).toBe(false);
  });

  it('selectMentorAgentReady reads the slice from the root state', () => {
    expect(selectMentorAgentReady({ mentor: { agentReady: true } } as any)).toBe(true);
  });

  it('sets spinnerHidden to true via setMentorSpinnerHidden(true)', () => {
    const state = mentorSlice.reducer(
      { spinnerHidden: false, agentReady: false },
      setMentorSpinnerHidden(true),
    );
    expect(state.spinnerHidden).toBe(true);
  });

  it('sets spinnerHidden to false via setMentorSpinnerHidden(false)', () => {
    const state = mentorSlice.reducer(
      { spinnerHidden: true, agentReady: false },
      setMentorSpinnerHidden(false),
    );
    expect(state.spinnerHidden).toBe(false);
  });

  it('ignores unknown actions and returns existing state unchanged', () => {
    const prev = { spinnerHidden: true, agentReady: false };
    const next = mentorSlice.reducer(prev, { type: 'something/unrelated' });
    expect(next).toBe(prev);
  });

  it('selectMentorSpinnerHidden reads the slice from the root state', () => {
    const rootState = { mentor: { spinnerHidden: true } } as any;
    expect(selectMentorSpinnerHidden(rootState)).toBe(true);
  });

  it('setMentorSpinnerHidden has the expected action shape', () => {
    expect(setMentorSpinnerHidden(true)).toEqual({
      type: 'mentor/setMentorSpinnerHidden',
      payload: true,
    });
  });
});
