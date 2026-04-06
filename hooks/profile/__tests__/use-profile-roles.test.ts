import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getUserId: vi.fn(() => 42),
  getUserName: vi.fn(() => 'test-user'),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCreateCatalogRole = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useCreateCatalogRoleMutation: vi.fn(() => [mockCreateCatalogRole, { isError: false }]),
}));

vi.mock('@iblai/iblai-api', () => ({}));

import { useProfileRoles } from '../use-profile-roles';
import { toast } from 'sonner';

describe('useProfileRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateCatalogRole.mockResolvedValue({});
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useProfileRoles());
    expect(result.current).toHaveProperty('handleDesiredRolesCreate');
    expect(typeof result.current.handleDesiredRolesCreate).toBe('function');
  });

  describe('handleDesiredRolesCreate', () => {
    it('creates roles and shows success toast when showToast is true', async () => {
      const roles = { roles: [{ name: 'Developer' }], user_id: 42 };
      const { result } = renderHook(() => useProfileRoles(true));

      let response: any;
      await act(async () => {
        response = await result.current.handleDesiredRolesCreate(roles as any);
      });

      expect(mockCreateCatalogRole).toHaveBeenCalledWith({
        requestBody: roles,
        userId: 42,
        username: 'test-user',
      });
      expect(toast.success).toHaveBeenCalledWith('Roles created successfully');
      expect(response).toBe(true);
    });

    it('does not show toast when showToast is false', async () => {
      const roles = { roles: [{ name: 'Developer' }], user_id: 42 };
      const { result } = renderHook(() => useProfileRoles(false));

      await act(async () => {
        await result.current.handleDesiredRolesCreate(roles as any);
      });

      expect(toast.success).not.toHaveBeenCalled();
    });

    it('shows error toast and returns false on exception', async () => {
      mockCreateCatalogRole.mockRejectedValue(new Error('Create role error'));

      const roles = { roles: [{ name: 'Developer' }], user_id: 42 };
      const { result } = renderHook(() => useProfileRoles());

      let response: any;
      await act(async () => {
        response = await result.current.handleDesiredRolesCreate(roles as any);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to create roles');
      expect(response).toBe(false);
    });

    it('defaults showToast to true', async () => {
      const roles = { roles: [], user_id: 42 };
      const { result } = renderHook(() => useProfileRoles());

      await act(async () => {
        await result.current.handleDesiredRolesCreate(roles as any);
      });

      expect(toast.success).toHaveBeenCalled();
    });
  });
});
