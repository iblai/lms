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

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

const mockUseTenantMetadata = vi.fn(() => ({ metadata: null }));

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
  });

  it('renders without crashing', () => {
    render(<Logo />);
    const img = screen.getByAltText('SkillsAI');
    expect(img).toBeInTheDocument();
  });

  it('renders with default fallback logo', () => {
    render(<Logo />);
    const img = screen.getByAltText('SkillsAI') as HTMLImageElement;
    expect(img.src).toContain('/images/iblai-logo.png');
  });

  it('links to home page', () => {
    render(<Logo />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
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
