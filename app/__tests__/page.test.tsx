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

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

// Mock useGetReportedSkillsQuery
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetReportedSkillsQuery: vi.fn(() => ({
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

// Mock redirect
const { mockRedirect } = vi.hoisted(() => ({ mockRedirect: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
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

import Home from '../page';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
// @ts-ignore
import { useGetReportedSkillsQuery } from '@iblai/iblai-js/data-layer';
import { config } from '@/lib/config';

describe('Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(config.settings.startPageEnabled).mockReturnValue(true);
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_start_screen_display: true },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useGetReportedSkillsQuery).mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  it('renders without crashing', () => {
    const { container } = render(<Home />);
    expect(container).toBeTruthy();
  });

  it('shows Spinner when metadata is loading', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: undefined,
      isLoading: true,
      isError: false,
    } as any);

    render(<Home />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows Spinner when reported skills are loading', () => {
    vi.mocked(useGetReportedSkillsQuery).mockReturnValue({
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<Home />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows Spinner when both metadata and skills are loading', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: undefined,
      isLoading: true,
      isError: false,
    } as any);
    vi.mocked(useGetReportedSkillsQuery).mockReturnValue({
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<Home />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('returns null when not loading', () => {
    render(<Home />);

    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('redirects to /home on metadata error', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: undefined,
      isLoading: false,
      isError: true,
    } as any);

    render(<Home />);

    expect(mockRedirect).toHaveBeenCalledWith('/home');
  });

  it('redirects to /home when startPageEnabled is false', () => {
    vi.mocked(config.settings.startPageEnabled).mockReturnValue(false);
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_start_screen_display: true },
      isLoading: false,
      isError: false,
    } as any);

    render(<Home />);

    expect(mockRedirect).toHaveBeenCalledWith('/home');
  });

  it('redirects to /home when enable_start_screen_display is false', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_start_screen_display: false },
      isLoading: false,
      isError: false,
    } as any);

    render(<Home />);

    expect(mockRedirect).toHaveBeenCalledWith('/home');
  });

  it('redirects to /home when metadata is null', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: null,
      isLoading: false,
      isError: false,
    } as any);

    render(<Home />);

    expect(mockRedirect).toHaveBeenCalledWith('/home');
  });

  it('redirects to /start when reported skills error has status 400', () => {
    vi.mocked(useGetReportedSkillsQuery).mockReturnValue({
      isLoading: false,
      isError: true,
      error: { status: 400 },
    } as any);

    render(<Home />);

    expect(mockRedirect).toHaveBeenCalledWith('/start');
  });

  it('redirects to /home when reported skills error has non-400 status', () => {
    vi.mocked(useGetReportedSkillsQuery).mockReturnValue({
      isLoading: false,
      isError: true,
      error: { status: 500 },
    } as any);

    render(<Home />);

    expect(mockRedirect).toHaveBeenCalledWith('/home');
  });

  it('redirects to /home when no error and skills not loading', () => {
    vi.mocked(useGetReportedSkillsQuery).mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<Home />);

    expect(mockRedirect).toHaveBeenCalledWith('/home');
  });

  it('does not redirect when metadata is loading', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: undefined,
      isLoading: true,
      isError: false,
    } as any);

    render(<Home />);

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('renders Spinner with correct class', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: undefined,
      isLoading: true,
      isError: false,
    } as any);

    render(<Home />);

    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('h-14', 'w-14');
  });
});
