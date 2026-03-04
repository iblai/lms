import { RootState } from '@/lib/store';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RbacPermissions = {
  skills: Record<string, unknown>;
  courses: Record<string, unknown>;
  programs: Record<string, unknown>;
};

type RbacState = {
  rbacPermissions: RbacPermissions | {};
};

const initialState: RbacState = {
  rbacPermissions: {},
};

const rbacSlice = createSlice({
  name: 'rbac',
  initialState,
  reducers: {
    updateRbacPermissions: (state, action: PayloadAction<RbacPermissions | {}>) => {
      state.rbacPermissions = {
        ...state.rbacPermissions,
        ...action.payload,
      };
    },
  },
});

export const { updateRbacPermissions } = rbacSlice.actions;

export default rbacSlice;

export const selectRbacPermissions = (state: RootState) => state.rbac.rbacPermissions;
