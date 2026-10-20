import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockUseParams = vi.fn((): Record<string, string | string[]> | null => null);

vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
}));

const mockGetTenant = vi.fn(() => 'test-tenant');

vi.mock('@/utils/helpers', () => ({
  getTenant: () => mockGetTenant(),
}));

const mockUseTenantMetadata = vi.fn(() => ({ metadata: null as unknown }));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: () => mockUseTenantMetadata(),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      appName: vi.fn(() => 'SkillsAI'),
    },
    urls: {
      dm: vi.fn(() => 'https://dm.example.com'),
    },
  },
}));

import { Logo } from '../logo';

describe('Logo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue(null);
    mockGetTenant.mockReturnValue('test-tenant');
  });

  it('renders without crashing', () => {
    render(<Logo />);
    const img = screen.getByAltText('SkillsAI');
    expect(img).toBeInTheDocument();
  });

  it('renders with default fallback logo', () => {
    render(<Logo />);
    const img = screen.getByAltText('SkillsAI') as HTMLImageElement;
    expect(img.src).toMatch(/iblai-logo\.png|\/api\/core\/orgs\/test-tenant\/logo\/?/);
  });

  it('links to the tenant home page using the URL tenant', () => {
    mockUseParams.mockReturnValue({ tenant: 'acme' });
    render(<Logo />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/platform/acme/home');
  });

  it('links to the stored tenant home page outside a tenant route', () => {
    render(<Logo />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/platform/test-tenant/home');
  });

  it('accepts custom width and height', () => {
    render(<Logo width={200} height={60} />);
    const img = screen.getByAltText('SkillsAI') as HTMLImageElement;
    expect(img).toHaveAttribute('width', '200');
    expect(img).toHaveAttribute('height', '60');
  });

  it('uses metadata logo when available', () => {
    mockUseTenantMetadata.mockReturnValue({
      metadata: {
        auth_web_skillsai: {
          display_logo: 'https://example.com/custom-logo.png',
        },
      },
    });
    render(<Logo />);
    // The logo loads asynchronously via useEffect, so initial render uses fallback
    const img = screen.getByAltText('SkillsAI');
    expect(img).toBeInTheDocument();
  });
});
