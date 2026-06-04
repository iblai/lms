import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseParams = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
}));

const mockGetTenant = vi.fn();
vi.mock('@/utils/helpers', () => ({
  getTenant: () => mockGetTenant(),
}));

import { useTenantParam } from '../use-tenant-param';

describe('useTenantParam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the tenant from a string url param', () => {
    mockUseParams.mockReturnValue({ tenant: 'acme' });
    const { result } = renderHook(() => useTenantParam());
    expect(result.current).toBe('acme');
  });

  it('returns the first entry when the param is an array', () => {
    mockUseParams.mockReturnValue({ tenant: ['acme', 'extra'] });
    const { result } = renderHook(() => useTenantParam());
    expect(result.current).toBe('acme');
  });

  it('falls back to the stored tenant when the url param is missing', () => {
    mockUseParams.mockReturnValue({});
    mockGetTenant.mockReturnValue('stored-tenant');
    const { result } = renderHook(() => useTenantParam());
    expect(result.current).toBe('stored-tenant');
  });

  it('falls back to the stored tenant when params is null', () => {
    mockUseParams.mockReturnValue(null);
    mockGetTenant.mockReturnValue('stored-tenant');
    const { result } = renderHook(() => useTenantParam());
    expect(result.current).toBe('stored-tenant');
  });

  it('returns an empty string when neither the url param nor the store has a tenant', () => {
    mockUseParams.mockReturnValue({});
    mockGetTenant.mockReturnValue(undefined);
    const { result } = renderHook(() => useTenantParam());
    expect(result.current).toBe('');
  });
});
