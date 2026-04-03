import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

const mockUseTenantMetadata = vi.fn();
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: () => mockUseTenantMetadata(),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

import WelcomeSlide from '../WelcomeSlide';

const defaultProps = {
  onNext: vi.fn(),
  onPrev: vi.fn(),
};

describe('WelcomeSlide', () => {
  it('renders without crashing', () => {
    mockUseTenantMetadata.mockReturnValue({ metadata: null });
    const { container } = render(<WelcomeSlide {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows default title when no metadata', () => {
    mockUseTenantMetadata.mockReturnValue({ metadata: null });
    render(<WelcomeSlide {...defaultProps} />);
    expect(screen.getByText(/Welcome to/)).toBeInTheDocument();
  });

  it('shows platform name from metadata', () => {
    mockUseTenantMetadata.mockReturnValue({
      metadata: { platform_name: 'My Academy' },
    });
    render(<WelcomeSlide {...defaultProps} />);
    expect(screen.getByText(/Welcome to My Academy/)).toBeInTheDocument();
  });

  it('shows display_title_info from metadata when available', () => {
    mockUseTenantMetadata.mockReturnValue({
      metadata: {
        auth_web_skillsai: { display_title_info: 'Custom Title' },
        platform_name: 'Fallback',
      },
    });
    render(<WelcomeSlide {...defaultProps} />);
    expect(screen.getByText(/Welcome to Custom Title/)).toBeInTheDocument();
  });

  it('falls back to ibl.ai academy when no metadata fields', () => {
    mockUseTenantMetadata.mockReturnValue({ metadata: {} });
    render(<WelcomeSlide {...defaultProps} />);
    expect(screen.getByText(/Welcome to ibl.ai academy/)).toBeInTheDocument();
  });

  it('displays the description text', () => {
    mockUseTenantMetadata.mockReturnValue({ metadata: null });
    render(<WelcomeSlide {...defaultProps} />);
    expect(screen.getByText(/Let's set your learning profile/)).toBeInTheDocument();
  });

  it('renders the rocket animation image', () => {
    mockUseTenantMetadata.mockReturnValue({ metadata: null });
    render(<WelcomeSlide {...defaultProps} />);
    expect(screen.getByAlt('Rocket animation')).toBeInTheDocument();
  });
});
