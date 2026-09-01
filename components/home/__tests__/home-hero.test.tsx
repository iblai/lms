import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: { hideDiscoverTab: vi.fn(() => false) },
  },
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'test-tenant',
}));

vi.mock('@/utils/discover-visibility', () => ({
  isDiscoverEnabled: vi.fn(() => true),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({ metadata: {} })),
}));

import { HomeHero } from '../home-hero';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

describe('HomeHero', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(useTenantMetadata).mockReturnValue({ metadata: {} } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderAtHour = (hour: number) => {
    vi.setSystemTime(new Date(2026, 6, 15, hour, 0, 0));
    render(<HomeHero />);
  };

  it('greets with "Good Morning" before noon', () => {
    renderAtHour(9);
    expect(screen.getByRole('heading', { name: /Good Morning/ })).toBeInTheDocument();
  });

  it('greets with "Good Afternoon" between noon and 6pm', () => {
    renderAtHour(14);
    expect(screen.getByRole('heading', { name: /Good Afternoon/ })).toBeInTheDocument();
  });

  it('greets with "Good Evening" from 6pm', () => {
    renderAtHour(20);
    expect(screen.getByRole('heading', { name: /Good Evening/ })).toBeInTheDocument();
  });

  it('shows the default tagline when the tenant sets none', () => {
    renderAtHour(9);
    expect(
      screen.getByText('Pick up where you left off or learn something new.'),
    ).toBeInTheDocument();
  });

  it('shows the tenant skills_welcome_tagline metadata when set', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { skills_welcome_tagline: 'Learn boldly, grow daily.' },
    } as any);
    renderAtHour(9);
    expect(screen.getByText('Learn boldly, grow daily.')).toBeInTheDocument();
    expect(
      screen.queryByText('Pick up where you left off or learn something new.'),
    ).not.toBeInTheDocument();
  });

  it('renders the Explore Catalog and My Courses CTAs', () => {
    renderAtHour(9);
    expect(screen.getByRole('link', { name: /Explore Catalog/ })).toHaveAttribute(
      'href',
      '/platform/test-tenant/discover',
    );
    expect(screen.getByRole('link', { name: /My Courses/ })).toHaveAttribute(
      'href',
      '/platform/test-tenant/discover?content=courses&enrolled=true',
    );
  });
});
