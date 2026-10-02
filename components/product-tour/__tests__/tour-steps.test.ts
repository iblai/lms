import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockIsVisible = vi.fn();
const mockFindFooter = vi.fn();
vi.mock('../tour-targets', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../tour-targets')>()),
  isTourTargetVisible: (target: unknown) => mockIsVisible(target),
  findSidebarFooter: () => mockFindFooter(),
}));

import { buildTourSteps, filterVisibleTourSteps } from '../tour-steps';

const ids = (steps: ReturnType<typeof buildTourSteps>) => steps.map((s) => s.id);

describe('buildTourSteps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gives a learner without Discover just the profile step', () => {
    const steps = buildTourSteps({
      viewer: { isAdmin: false, isWatcher: false },
      discoverEnabled: false,
    });
    expect(ids(steps)).toEqual(['profile']);
    expect(steps[0]).toMatchObject({
      target: '[data-tour="profile"]',
      placement: 'bottom-end',
      title: 'Your profile',
    });
  });

  it('adds Search and Discover (header first, then the sidebar) when Discover is enabled', () => {
    const steps = buildTourSteps({
      viewer: { isAdmin: false, isWatcher: false },
      discoverEnabled: true,
    });
    expect(ids(steps)).toEqual(['profile', 'search', 'discover']);
    expect(steps[1]).toMatchObject({ target: 'header form[role="search"]', placement: 'bottom' });
    expect(steps[2]).toMatchObject({
      target: '[data-tour="discover"]',
      placement: 'right',
      isFixed: true,
    });
  });

  it('adds the account step with admin copy for a platform admin', () => {
    const steps = buildTourSteps({
      viewer: { isAdmin: true, isWatcher: false },
      discoverEnabled: true,
    });
    expect(ids(steps)).toEqual(['profile', 'search', 'discover', 'account']);
    const account = steps[3];
    expect(account).toMatchObject({
      title: 'Manage your organization',
      placement: 'right-end',
      isFixed: true,
    });
    expect(account.content).toMatch(/invite people/i);
  });

  it('adds the account step with watcher copy for a watcher who is not an admin', () => {
    const steps = buildTourSteps({
      viewer: { isAdmin: false, isWatcher: true },
      discoverEnabled: false,
    });
    expect(ids(steps)).toEqual(['profile', 'account']);
    expect(steps[1].title).toBe('Management');
    expect(steps[1].content).toMatch(/groups you watch/i);
  });

  it('uses admin copy when someone is both admin and watcher', () => {
    const steps = buildTourSteps({
      viewer: { isAdmin: true, isWatcher: true },
      discoverEnabled: false,
    });
    expect(steps[1].title).toBe('Manage your organization');
  });

  it('resolves the account target lazily through the sidebar footer lookup', () => {
    const footer = document.createElement('div');
    mockFindFooter.mockReturnValue(footer);
    const steps = buildTourSteps({
      viewer: { isAdmin: true, isWatcher: false },
      discoverEnabled: false,
    });
    const target = steps[1].target;
    expect(typeof target).toBe('function');
    expect((target as () => HTMLElement | null)()).toBe(footer);
    expect(mockFindFooter).toHaveBeenCalledTimes(1);
  });
});

describe('filterVisibleTourSteps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps only the steps whose target is on the page', () => {
    const steps = buildTourSteps({
      viewer: { isAdmin: true, isWatcher: false },
      discoverEnabled: true,
    });
    mockIsVisible.mockImplementation(
      (target: unknown) => target === '[data-tour="profile"]' || typeof target === 'function',
    );
    expect(ids(filterVisibleTourSteps(steps))).toEqual(['profile', 'account']);
    expect(mockIsVisible).toHaveBeenCalledTimes(4);
  });

  it('returns an empty list when nothing is mounted yet', () => {
    mockIsVisible.mockReturnValue(false);
    const steps = buildTourSteps({
      viewer: { isAdmin: false, isWatcher: false },
      discoverEnabled: true,
    });
    expect(filterVisibleTourSteps(steps)).toEqual([]);
  });
});
