import { describe, it, expect, vi, beforeEach } from 'vitest';
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

const mockUseChatState = vi.fn(() => ({ isOpen: false }));

vi.mock('../chat-button', () => ({
  useChatState: () => mockUseChatState(),
}));

const mockUseTenantMetadata = vi.fn(() => ({ metadata: null }));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: () => mockUseTenantMetadata(),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  parseMarkdownLinks: vi.fn(() => []),
}));

vi.mock('@/utils/localstorage', () => ({
  useCurrentTenant: vi.fn(() => ({
    currentTenant: { platform_name: 'TestPlatform' },
  })),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      footerMenus: vi.fn(() => ''),
      footerMenusEnabled: vi.fn(() => false),
      copyright: vi.fn(() => '(c) 2024 TestCorp'),
    },
    urls: {
      dm: vi.fn(() => 'https://dm.example.com'),
    },
  },
}));

import { Footer } from '../footer';

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChatState.mockReturnValue({ isOpen: false });
  });

  it('renders without crashing', () => {
    render(<Footer />);
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('displays platform name when available', () => {
    render(<Footer />);
    expect(screen.getByText(/TestPlatform/)).toBeInTheDocument();
  });

  it('displays copyright when no platform name', async () => {
    const { useCurrentTenant } = await import('@/utils/localstorage');
    vi.mocked(useCurrentTenant).mockReturnValue({
      currentTenant: { platform_name: '' },
    } as any);

    const { config } = await import('@/lib/config');
    vi.mocked(config.settings.copyright).mockReturnValue('(c) 2024 TestCorp');

    render(<Footer />);
    expect(screen.getByText('(c) 2024 TestCorp')).toBeInTheDocument();
  });

  it('applies hidden class on mobile when chat is open', () => {
    mockUseChatState.mockReturnValue({ isOpen: true });
    render(<Footer />);
    const footer = document.querySelector('footer');
    expect(footer?.className).toContain('hidden');
    expect(footer?.className).toContain('sm:flex');
  });

  it('applies full width when chat is closed', () => {
    mockUseChatState.mockReturnValue({ isOpen: false });
    render(<Footer />);
    const footer = document.querySelector('footer');
    expect(footer?.className).toContain('w-full');
  });
});
