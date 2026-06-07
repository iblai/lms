import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock config
vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      startPageEnabled: vi.fn(() => true),
    },
  },
}));

// Mock redirect
const { mockRedirect } = vi.hoisted(() => ({ mockRedirect: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

// Mock useTenantParam
vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: vi.fn(() => 'test-tenant'),
}));

// Mock useTenantMetadata
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({
    metadata: { enable_start_screen_display: true },
    isLoading: false,
    isError: false,
  })),
}));

// Mock Spinner component
vi.mock('@/components/spinner', () => ({
  Spinner: ({ className }: { className?: string }) => (
    <div data-testid="spinner" className={className}>
      Loading...
    </div>
  ),
}));

// Mock OnboardingFlow component
vi.mock('@/components/onboarding', () => ({
  default: () => <div data-testid="onboarding-flow">Onboarding</div>,
}));

import StartOnboarding from '../page';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { config } from '@/lib/config';

describe('StartOnboarding page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(config.settings.startPageEnabled).mockReturnValue(true);
    vi.mocked(useTenantParam).mockReturnValue('test-tenant');
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_start_screen_display: true },
      isLoading: false,
      isError: false,
    } as any);
  });

  it('renders the onboarding flow when enabled and loaded', () => {
    render(<StartOnboarding />);

    expect(screen.getByTestId('onboarding-flow')).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('shows the Spinner while metadata is loading (still enabled)', () => {
    // Keep startPageEnabled truthy by providing enabled metadata so the
    // loading branch is reached rather than the redirect branch.
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_start_screen_display: true },
      isLoading: true,
      isError: false,
    } as any);

    render(<StartOnboarding />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('onboarding-flow')).not.toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('renders the Spinner with the correct className', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_start_screen_display: true },
      isLoading: true,
      isError: false,
    } as any);

    render(<StartOnboarding />);

    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('h-14', 'w-14', 'text-[var(--primary)]');
  });

  it('redirects to /home when startPageEnabled returns false', () => {
    vi.mocked(config.settings.startPageEnabled).mockReturnValue(false);

    render(<StartOnboarding />);

    expect(mockRedirect).toHaveBeenCalledWith('/platform/test-tenant/home');
  });

  it('redirects to /home when enable_start_screen_display is false', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_start_screen_display: false },
      isLoading: false,
      isError: false,
    } as any);

    render(<StartOnboarding />);

    expect(mockRedirect).toHaveBeenCalledWith('/platform/test-tenant/home');
  });

  it('redirects to /home when metadata is null', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: null,
      isLoading: false,
      isError: false,
    } as any);

    render(<StartOnboarding />);

    expect(mockRedirect).toHaveBeenCalledWith('/platform/test-tenant/home');
  });

  it('redirects to /home when metadata is undefined', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: undefined,
      isLoading: false,
      isError: false,
    } as any);

    render(<StartOnboarding />);

    expect(mockRedirect).toHaveBeenCalledWith('/platform/test-tenant/home');
  });

  it('redirects to /home on metadata error even when otherwise enabled', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_start_screen_display: true },
      isLoading: false,
      isError: true,
    } as any);

    render(<StartOnboarding />);

    expect(mockRedirect).toHaveBeenCalledWith('/platform/test-tenant/home');
  });

  it('uses the tenant from useTenantParam in the redirect target', () => {
    vi.mocked(useTenantParam).mockReturnValue('acme');
    vi.mocked(config.settings.startPageEnabled).mockReturnValue(false);

    render(<StartOnboarding />);

    expect(mockRedirect).toHaveBeenCalledWith('/platform/acme/home');
  });
});
