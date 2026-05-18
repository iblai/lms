import { describe, it, expect } from 'vitest';
import mentorSlice, { setMentorSpinnerHidden, selectMentorSpinnerHidden } from '../mentor-slice';

describe('mentorSlice', () => {
  it('starts with spinnerHidden=false', () => {
    const state = mentorSlice.reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({ spinnerHidden: false });
  });

  it('sets spinnerHidden to true via setMentorSpinnerHidden(true)', () => {
    const state = mentorSlice.reducer({ spinnerHidden: false }, setMentorSpinnerHidden(true));
    expect(state.spinnerHidden).toBe(true);
  });

  it('sets spinnerHidden to false via setMentorSpinnerHidden(false)', () => {
    const state = mentorSlice.reducer({ spinnerHidden: true }, setMentorSpinnerHidden(false));
    expect(state.spinnerHidden).toBe(false);
  });

  it('ignores unknown actions and returns existing state unchanged', () => {
    const prev = { spinnerHidden: true };
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
