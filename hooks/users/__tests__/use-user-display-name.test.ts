import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/utils/helpers', () => ({ getTenant: vi.fn(() => 'acme') }));

const profileQuery = vi.fn();
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetUserProfileSummaryQuery: (...args: unknown[]) => profileQuery(...args),
}));

import { useUserDisplayName } from '../use-user-display-name';

describe('useUserDisplayName', () => {
  beforeEach(() => {
    profileQuery.mockReset();
    profileQuery.mockReturnValue({ data: undefined });
  });

  it('asks the profile API for the username on the current tenant', () => {
    renderHook(() => useUserDisplayName('ada', 'Ada L.'));
    expect(profileQuery).toHaveBeenCalledWith(
      { username: 'ada', platformKey: 'acme' },
      { skip: false },
    );
  });

  it('skips the lookup without a username', () => {
    const { result } = renderHook(() => useUserDisplayName(undefined, 'Someone'));
    expect(profileQuery).toHaveBeenCalledWith(
      { username: undefined, platformKey: 'acme' },
      { skip: true },
    );
    expect(result.current).toBe('Someone');
  });

  it('prefers the profile name, then its email', () => {
    profileQuery.mockReturnValue({ data: { name: ' Ada Lovelace ', email: 'ada@x.org' } });
    expect(renderHook(() => useUserDisplayName('ada', 'fallback')).result.current).toBe(
      'Ada Lovelace',
    );
    profileQuery.mockReturnValue({ data: { name: '', email: 'ada@x.org' } });
    expect(renderHook(() => useUserDisplayName('ada', 'fallback')).result.current).toBe(
      'ada@x.org',
    );
  });

  it('does not count a name that is just the username', () => {
    profileQuery.mockReturnValue({ data: { name: 'ada', email: 'ada@x.org' } });
    expect(renderHook(() => useUserDisplayName('ada', 'fallback')).result.current).toBe(
      'ada@x.org',
    );
    profileQuery.mockReturnValue({ data: { name: 'ada', email: '' } });
    expect(renderHook(() => useUserDisplayName('ada', 'Ada L.')).result.current).toBe('Ada L.');
  });

  it('falls back to the caller’s label while loading, then to the username itself', () => {
    expect(renderHook(() => useUserDisplayName('ada', 'ada@x.org')).result.current).toBe(
      'ada@x.org',
    );
    expect(renderHook(() => useUserDisplayName('ada')).result.current).toBe('ada');
    expect(renderHook(() => useUserDisplayName(undefined)).result.current).toBe('');
  });
});
