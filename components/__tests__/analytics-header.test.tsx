import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

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

import { AnalyticsHeader } from '../analytics-header';

describe('AnalyticsHeader', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnalyticsHeader />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the logo link', () => {
    render(<AnalyticsHeader />);
    const logoLink = screen.getByRole('link');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders the ibl.ai logo image', () => {
    render(<AnalyticsHeader />);
    expect(screen.getByAltText('ibl.ai Logo')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<AnalyticsHeader />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('renders Skills AI button', () => {
    render(<AnalyticsHeader />);
    expect(screen.getByText('Skills AI')).toBeInTheDocument();
  });

  it('renders Invites button', () => {
    render(<AnalyticsHeader />);
    expect(screen.getByText('Invites')).toBeInTheDocument();
  });

  it('renders Downloads button', () => {
    render(<AnalyticsHeader />);
    expect(screen.getByText('Downloads')).toBeInTheDocument();
  });

  it('renders profile image', () => {
    render(<AnalyticsHeader />);
    expect(screen.getByAltText('Profile')).toBeInTheDocument();
  });

  it('renders as a header element', () => {
    render(<AnalyticsHeader />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });
});
