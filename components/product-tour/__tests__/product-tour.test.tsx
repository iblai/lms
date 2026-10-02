import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const state = vi.hoisted(() => ({
  pathname: '/platform/test-tenant/home',
  search: '',
  isMobile: false,
  metadata: { metadata: {} as Record<string, unknown>, metadataLoaded: true },
  role: {
    data: { is_platform_admin: false } as { is_platform_admin?: boolean } | undefined,
    isLoading: false,
  },
  rbac: [] as string[],
  tour: {
    completed: false,
    outcome: null as string | null,
    isLoading: false,
    isError: false,
    markCompleted: vi.fn(),
  },
  tourUsername: undefined as unknown,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => state.pathname,
  useSearchParams: () => new URLSearchParams(state.search),
}));

vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  useSidebar: () => ({ isMobile: state.isMobile }),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: () => state.metadata,
}));

vi.mock('@/lib/config', () => ({
  config: { settings: { hideDiscoverTab: vi.fn(() => false) } },
}));

vi.mock('@/lib/hooks', () => ({
  useAppSelector: () => state.rbac,
}));

vi.mock('@/features/rbac', () => ({
  selectRbacPermissions: vi.fn(),
}));

vi.mock('@/hoc', () => ({
  checkRbacPermission: (permissions: string[], resource: string) => permissions.includes(resource),
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'test-tenant',
}));

vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: () => state.role,
}));

vi.mock('@/utils/course-content-mode', () => ({
  WATCHER_RBAC_RESOURCE: '/watchedgroups/#list',
}));

vi.mock('@/utils/discover-visibility', () => ({
  isDiscoverEnabled: vi.fn(() => true),
}));

vi.mock('@/utils/helpers', () => ({
  getUserName: vi.fn(() => 'test-user'),
}));

const steps = vi.hoisted(() => ({
  all: [
    { id: 'profile', target: '[data-tour="profile"]', content: 'Profile' },
    { id: 'search', target: 'header form[role="search"]', content: 'Search' },
  ],
  build: vi.fn(),
  filter: vi.fn(),
}));

vi.mock('../tour-steps', () => ({
  buildTourSteps: (...args: unknown[]) => steps.build(...args),
  filterVisibleTourSteps: (list: unknown[]) => steps.filter(list),
}));

vi.mock('../use-tour-completion', () => ({
  useTourCompletion: (username: unknown) => {
    state.tourUsername = username;
    return state.tour;
  },
}));

vi.mock('../tour-runner', () => ({
  TourRunner: ({ steps: list, run, onEnd }: any) => (
    <div
      data-testid="tour-runner"
      data-run={String(run)}
      data-steps={list.map((s: { id: string }) => s.id).join(',')}
    >
      <button onClick={() => onEnd('finished')}>finish</button>
      <button onClick={() => onEnd('skipped')}>skip</button>
    </div>
  ),
}));

import {
  ProductTour,
  isTourExcludedPath,
  TOUR_START_DELAY_MS,
  TOUR_START_MAX_ATTEMPTS,
  TOUR_START_RETRY_MS,
} from '../product-tour';
import { isDiscoverEnabled } from '@/utils/discover-visibility';
import { getUserName } from '@/utils/helpers';

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

/** Advance past the grace period, then wait (real timers) for the lazy runner. */
async function startTour() {
  await advance(TOUR_START_DELAY_MS);
  vi.useRealTimers();
  return screen.findByTestId('tour-runner');
}

const settleTime = TOUR_START_DELAY_MS + TOUR_START_RETRY_MS * TOUR_START_MAX_ATTEMPTS * 2;

describe('isTourExcludedPath', () => {
  it.each([
    '/platform/t/onboarding',
    '/platform/t/onboarding/agent-x',
    '/platform/t/course-content/course-v1:a+b+c/course',
    '/platform/t/start',
    '/platform/t/start/',
  ])('excludes %s', (pathname) => {
    expect(isTourExcludedPath(pathname)).toBe(true);
  });

  it.each([
    '/platform/t/home',
    '/platform/t/discover',
    '/platform/t/profile',
    '/platform/t/courses/course-v1:a+b+c',
    '/platform/t/analytics',
  ])('allows %s', (pathname) => {
    expect(isTourExcludedPath(pathname)).toBe(false);
  });

  it('excludes a missing pathname', () => {
    expect(isTourExcludedPath(null)).toBe(true);
    expect(isTourExcludedPath(undefined)).toBe(true);
    expect(isTourExcludedPath('')).toBe(true);
  });

  it('ignores a query string', () => {
    expect(isTourExcludedPath('/platform/t/home?tour=1')).toBe(false);
    expect(isTourExcludedPath('/platform/t/onboarding?x=1')).toBe(true);
  });
});

describe('ProductTour', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    state.pathname = '/platform/test-tenant/home';
    state.search = '';
    state.isMobile = false;
    state.metadata = { metadata: {}, metadataLoaded: true };
    state.role = { data: { is_platform_admin: false }, isLoading: false };
    state.rbac = [];
    state.tour = {
      completed: false,
      outcome: null,
      isLoading: false,
      isError: false,
      markCompleted: vi.fn(),
    };
    vi.mocked(getUserName).mockReturnValue('test-user');
    steps.build.mockReset().mockReturnValue(steps.all);
    steps.filter.mockReset().mockImplementation((list) => list);
    vi.mocked(isDiscoverEnabled).mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts after the shell grace period with the steps that are on the page', async () => {
    render(<ProductTour />);
    expect(screen.queryByTestId('tour-runner')).not.toBeInTheDocument();
    expect(steps.build).not.toHaveBeenCalled();

    const runner = await startTour();

    expect(runner).toHaveAttribute('data-run', 'true');
    expect(runner).toHaveAttribute('data-steps', 'profile,search');
    expect(steps.build).toHaveBeenCalledTimes(1);
    expect(steps.build).toHaveBeenCalledWith({
      viewer: { isAdmin: false, isWatcher: false },
      discoverEnabled: true,
    });
    expect(state.tourUsername).toBe('test-user');
  });

  it('hands the admin, watcher, and Discover signals to the step builder', async () => {
    state.role = { data: { is_platform_admin: true }, isLoading: false };
    state.rbac = ['/watchedgroups/#list'];
    vi.mocked(isDiscoverEnabled).mockReturnValue(false);

    render(<ProductTour />);
    await startTour();

    expect(steps.build).toHaveBeenCalledWith({
      viewer: { isAdmin: true, isWatcher: true },
      discoverEnabled: false,
    });
  });

  it('retries until the targets are mounted', async () => {
    steps.filter.mockReturnValueOnce([]).mockReturnValueOnce([]);
    render(<ProductTour />);

    await advance(TOUR_START_DELAY_MS);
    expect(steps.build).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('tour-runner')).not.toBeInTheDocument();

    await advance(TOUR_START_RETRY_MS);
    expect(steps.build).toHaveBeenCalledTimes(2);

    await advance(TOUR_START_RETRY_MS);
    expect(steps.build).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
    expect(await screen.findByTestId('tour-runner')).toHaveAttribute(
      'data-steps',
      'profile,search',
    );
  });

  it('gives up after the retry budget when nothing mounts', async () => {
    steps.filter.mockReturnValue([]);
    render(<ProductTour />);

    await advance(settleTime);

    expect(steps.build).toHaveBeenCalledTimes(TOUR_START_MAX_ATTEMPTS);
    expect(screen.queryByTestId('tour-runner')).not.toBeInTheDocument();
  });

  it.each(['finished', 'skipped'])('does not run again once the user %s it', async (outcome) => {
    state.tour.completed = true;
    state.tour.outcome = outcome;
    render(<ProductTour />);

    await advance(settleTime);

    expect(steps.build).not.toHaveBeenCalled();
    expect(screen.queryByTestId('tour-runner')).not.toBeInTheDocument();
  });

  it('replays with ?tour=1 even after it was completed', async () => {
    state.tour.completed = true;
    state.tour.outcome = 'finished';
    state.search = 'tour=1';
    render(<ProductTour />);

    expect(await startTour()).toBeInTheDocument();
  });

  it('ignores other values of the tour param', async () => {
    state.tour.completed = true;
    state.tour.outcome = 'finished';
    state.search = 'tour=0';
    render(<ProductTour />);

    await advance(settleTime);

    expect(steps.build).not.toHaveBeenCalled();
  });

  it('stays quiet on mobile, where the search box and sidebar rail are hidden', async () => {
    state.isMobile = true;
    render(<ProductTour />);

    await advance(settleTime);

    expect(steps.build).not.toHaveBeenCalled();
  });

  it.each([
    '/platform/test-tenant/onboarding',
    '/platform/test-tenant/course-content/course-v1:a+b+c/course',
    '/platform/test-tenant/start',
  ])('stays quiet on %s', async (pathname) => {
    state.pathname = pathname;
    render(<ProductTour />);

    await advance(settleTime);

    expect(steps.build).not.toHaveBeenCalled();
  });

  it('waits for the tenant metadata and the role check before starting', async () => {
    state.metadata = { metadata: {}, metadataLoaded: false };
    const { rerender } = render(<ProductTour />);
    await advance(settleTime);
    expect(steps.build).not.toHaveBeenCalled();

    state.metadata = { metadata: {}, metadataLoaded: true };
    state.role = { data: undefined, isLoading: true };
    rerender(<ProductTour />);
    await advance(settleTime);
    expect(steps.build).not.toHaveBeenCalled();

    state.role = { data: { is_platform_admin: false }, isLoading: false };
    rerender(<ProductTour />);
    expect(await startTour()).toBeInTheDocument();
  });

  it('waits for the user metadata (tour state) before starting', async () => {
    state.tour.isLoading = true;
    const { rerender } = render(<ProductTour />);
    await advance(settleTime);
    expect(steps.build).not.toHaveBeenCalled();

    state.tour = { ...state.tour, isLoading: false };
    rerender(<ProductTour />);
    expect(await startTour()).toBeInTheDocument();
  });

  it('stays quiet when the metadata could not be read, unless a replay is forced', async () => {
    state.tour.isError = true;
    const { rerender } = render(<ProductTour />);
    await advance(settleTime);
    expect(steps.build).not.toHaveBeenCalled();

    state.search = 'tour=1';
    rerender(<ProductTour />);
    expect(await startTour()).toBeInTheDocument();
  });

  it('stays quiet without a logged-in username', async () => {
    vi.mocked(getUserName).mockReturnValue(null);
    render(<ProductTour />);
    await advance(settleTime);
    expect(steps.build).not.toHaveBeenCalled();
  });

  it('cancels a pending start when the page becomes ineligible', async () => {
    const { rerender } = render(<ProductTour />);
    await advance(TOUR_START_DELAY_MS / 2);

    state.pathname = '/platform/test-tenant/onboarding';
    rerender(<ProductTour />);
    await advance(settleTime);

    expect(steps.build).not.toHaveBeenCalled();
  });

  it.each([
    ['finish', 'finished'],
    ['skip', 'skipped'],
  ])('records the outcome and unmounts the tour on %s', async (button, outcome) => {
    render(<ProductTour />);
    await startTour();

    fireEvent.click(screen.getByText(button));

    expect(state.tour.markCompleted).toHaveBeenCalledWith(outcome);
    expect(screen.queryByTestId('tour-runner')).not.toBeInTheDocument();
  });

  it('does not restart in the same session after ending, even with ?tour=1', async () => {
    state.search = 'tour=1';
    render(<ProductTour />);
    await startTour();
    fireEvent.click(screen.getByText('finish'));

    vi.useFakeTimers();
    await advance(settleTime);

    expect(steps.build).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('tour-runner')).not.toBeInTheDocument();
  });
});
