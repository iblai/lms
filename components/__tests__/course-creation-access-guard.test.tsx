import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: vi.fn(() => 'test-tenant'),
}));

const mockUseCurrentTenant = vi.fn();
vi.mock('@/utils/localstorage', () => ({
  useCurrentTenant: () => mockUseCurrentTenant(),
}));

vi.mock('@/lib/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

vi.mock('@/features/rbac', () => ({
  selectRbacPermissions: vi.fn(() => ({ some: 'permissions' })),
}));

const mockCheckRbacPermission = vi.fn();
vi.mock('@/hoc', () => ({
  checkRbacPermission: (permissions: object, resource: string) =>
    mockCheckRbacPermission(permissions, resource),
}));

import { useCanCreateCourse } from '../course-creation-access-guard';

describe('useCanCreateCourse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentTenant.mockReturnValue({ currentTenant: { is_admin: false } });
    mockCheckRbacPermission.mockReturnValue(false);
  });

  it('allows course creation for tenant admins', () => {
    mockUseCurrentTenant.mockReturnValue({ currentTenant: { is_admin: true } });

    const { result } = renderHook(() => useCanCreateCourse());

    expect(result.current.canCreateCourse).toBe(true);
    expect(result.current.resolved).toBe(true);
  });

  it('allows course creation via RBAC permission for non-admins', () => {
    mockCheckRbacPermission.mockReturnValue(true);

    const { result } = renderHook(() => useCanCreateCourse());

    expect(result.current.canCreateCourse).toBe(true);
  });

  it('checks the tenant-scoped can_create_course RBAC resource', () => {
    renderHook(() => useCanCreateCourse());

    expect(mockCheckRbacPermission).toHaveBeenCalledWith(
      { some: 'permissions' },
      '/platforms/test-tenant/#can_create_course',
    );
  });

  it('denies course creation when neither admin nor RBAC permission', () => {
    const { result } = renderHook(() => useCanCreateCourse());

    expect(result.current.canCreateCourse).toBe(false);
    expect(result.current.resolved).toBe(true);
  });

  it('reports unresolved while the stored tenant is still null', () => {
    mockUseCurrentTenant.mockReturnValue({ currentTenant: null });

    const { result } = renderHook(() => useCanCreateCourse());

    expect(result.current.canCreateCourse).toBe(false);
    expect(result.current.resolved).toBe(false);
  });
});
