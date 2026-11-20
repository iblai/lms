import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const state = vi.hoisted(() => ({
  currentTenant: null as any,
  userTenants: [] as any[],
}));

vi.mock('@/lib/hooks', () => ({
  useAppSelector: () => ({}),
}));

vi.mock('@/features/rbac', () => ({
  selectRbacPermissions: vi.fn(),
}));

const mockCheckRbacPermission = vi.hoisted(() => vi.fn((..._args: any[]) => true));
vi.mock('@/hoc', () => ({
  checkRbacPermission: (...args: any[]) => mockCheckRbacPermission(...args),
}));

vi.mock('@/utils/localstorage', async () => {
  const actual =
    await vi.importActual<typeof import('@/utils/localstorage')>('@/utils/localstorage');
  return {
    canMonetize: actual.canMonetize,
    useCurrentTenant: () => ({ currentTenant: state.currentTenant }),
    useUserTenants: () => ({ userTenants: state.userTenants }),
  };
});

import { useCanSellItems } from '../use-can-sell-items';

describe('useCanSellItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.currentTenant = { key: 'acme', enable_monetization: true };
    state.userTenants = [];
    mockCheckRbacPermission.mockReturnValue(true);
  });

  it('is true when the tenant has monetization and the user can sell', () => {
    const { result } = renderHook(() => useCanSellItems('acme'));
    expect(result.current).toBe(true);
    expect(mockCheckRbacPermission).toHaveBeenCalledWith({}, '/platforms/acme/#can_sell_items');
  });

  it('is false without the can_sell_items permission', () => {
    mockCheckRbacPermission.mockReturnValue(false);
    const { result } = renderHook(() => useCanSellItems('acme'));
    expect(result.current).toBe(false);
  });

  it('is false when the tenant has monetization off', () => {
    state.currentTenant = { key: 'acme', enable_monetization: false };
    const { result } = renderHook(() => useCanSellItems('acme'));
    expect(result.current).toBe(false);
  });

  it('falls back to the user tenant list for the monetization flag', () => {
    state.currentTenant = { key: 'acme' };
    state.userTenants = [{ key: 'acme', enable_monetization: true }];
    const { result } = renderHook(() => useCanSellItems('acme'));
    expect(result.current).toBe(true);
  });

  it('is false before the current tenant is known', () => {
    state.currentTenant = null;
    const { result } = renderHook(() => useCanSellItems('acme'));
    expect(result.current).toBe(false);
  });
});
