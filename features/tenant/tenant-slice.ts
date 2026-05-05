import { RootState } from '@/lib/store';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type TenantState = {
  requestedTenant: string;
};

const initialState: TenantState = {
  requestedTenant: '',
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    updateRequestedTenant: (state, action: PayloadAction<string>) => {
      state.requestedTenant = action.payload;
    },
  },
});

export const { updateRequestedTenant } = tenantSlice.actions;

export default tenantSlice;

export const selectRequestedTenant = (state: RootState) => state.tenant.requestedTenant;
