import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockMetadata = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({ metadata: mockMetadata.current })),
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'url-tenant',
}));

import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useUnitAutoCompletion } from '../use-unit-auto-completion';

const agentCourse = { agent_content_mode: true, enable_agent_based_completion: true } as any;

const renderUnitAutoCompletion = (params: Record<string, unknown> = {}) =>
  renderHook(() =>
    useUnitAutoCompletion({
      course: agentCourse,
      ...params,
    } as any),
  );

describe('useUnitAutoCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMetadata.current = { enable_agent_based_unit_completion: true };
  });

  // Where the learner is — agent tab or course tab, learning or assessment —
  // no longer factors in: the flags alone decide.
  it('disables auto-completion when the tenant flag and both course flags are on', () => {
    const { result } = renderUnitAutoCompletion();

    expect(result.current.unitAutoCompletionDisabled).toBe(true);
    expect(result.current.unitAutoCompletionEnabled).toBe(false);
  });

  it('leaves auto-completion on when the tenant flag is off', () => {
    mockMetadata.current = { enable_agent_based_unit_completion: false };

    const { result } = renderUnitAutoCompletion();

    expect(result.current.unitAutoCompletionEnabled).toBe(true);
  });

  it('leaves auto-completion on when metadata has not loaded yet', () => {
    mockMetadata.current = undefined as any;

    const { result } = renderUnitAutoCompletion();

    expect(result.current.unitAutoCompletionEnabled).toBe(true);
  });

  it('leaves auto-completion on when the course opts out of agent-based completion', () => {
    const { result } = renderUnitAutoCompletion({
      course: { agent_content_mode: true, enable_agent_based_completion: false },
    });

    expect(result.current.unitAutoCompletionEnabled).toBe(true);
  });

  it('leaves auto-completion on when the course is not in agent content mode', () => {
    const { result } = renderUnitAutoCompletion({
      course: { agent_content_mode: false, enable_agent_based_completion: true },
    });

    expect(result.current.unitAutoCompletionEnabled).toBe(true);
  });

  it('leaves auto-completion on with no course loaded', () => {
    const { result } = renderUnitAutoCompletion({ course: null });

    expect(result.current.unitAutoCompletionEnabled).toBe(true);
  });

  it('reads metadata for the explicit tenant, falling back to the URL tenant', () => {
    renderUnitAutoCompletion({ tenant: 'explicit-tenant' });
    expect(useTenantMetadata).toHaveBeenCalledWith({ org: 'explicit-tenant' });

    vi.mocked(useTenantMetadata).mockClear();
    renderUnitAutoCompletion({ tenant: undefined });
    expect(useTenantMetadata).toHaveBeenCalledWith({ org: 'url-tenant' });
  });
});
