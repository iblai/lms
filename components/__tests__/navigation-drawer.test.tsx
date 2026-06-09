import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, onClick, ...props }: any) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  usePathname: vi.fn(() => '/platform/test-tenant/home'),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: vi.fn(() => ({
    data: { is_platform_admin: false, is_department_admin: false },
  })),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  isLoggedIn: vi.fn(() => true),
}));

vi.mock('../logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

import { NavigationDrawer } from '../navigation-drawer';

describe('NavigationDrawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { isLoggedIn } = await import('@iblai/iblai-js/web-utils');
    vi.mocked(isLoggedIn).mockReturnValue(true);
  });

  it('renders without crashing when open', () => {
    render(<NavigationDrawer {...defaultProps} />);
    expect(screen.getByTestId('logo')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(<NavigationDrawer {...defaultProps} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByText('Discover')).toBeInTheDocument();
  });

  it('hides Home, Profile and Recommended when not logged in', async () => {
    const { isLoggedIn } = await import('@iblai/iblai-js/web-utils');
    vi.mocked(isLoggedIn).mockReturnValue(false);
    render(<NavigationDrawer {...defaultProps} />);
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
    // Discover stays available to logged-out users
    expect(screen.getByText('Discover')).toBeInTheDocument();
  });

  it('does not render AI Analytics when user is not admin', () => {
    render(<NavigationDrawer {...defaultProps} />);
    expect(screen.queryByText('AI Analytics')).not.toBeInTheDocument();
  });

  it('renders AI Analytics when user is platform admin', async () => {
    const { useGetDepartmentMemberCheckQuery } = await import('@/services/core');
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: true, is_department_admin: false },
    } as any);
    render(<NavigationDrawer {...defaultProps} />);
    expect(screen.getByText('AI Analytics')).toBeInTheDocument();
  });

  it('renders AI Analytics when user is department admin', async () => {
    const { useGetDepartmentMemberCheckQuery } = await import('@/services/core');
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false, is_department_admin: true },
    } as any);
    render(<NavigationDrawer {...defaultProps} />);
    expect(screen.getByText('AI Analytics')).toBeInTheDocument();
  });

  it('shows backdrop when open', () => {
    const { container } = render(<NavigationDrawer {...defaultProps} />);
    const backdrop = container.querySelector('.bg-opacity-50');
    expect(backdrop).toBeInTheDocument();
  });

  it('does not show backdrop when closed', () => {
    const { container } = render(<NavigationDrawer {...defaultProps} isOpen={false} />);
    const backdrop = container.querySelector('.bg-opacity-50');
    expect(backdrop).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const { container } = render(<NavigationDrawer {...defaultProps} />);
    const backdrop = container.querySelector('.bg-opacity-50');
    fireEvent.click(backdrop!);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    render(<NavigationDrawer {...defaultProps} />);
    // The X button
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when a navigation link is clicked', () => {
    render(<NavigationDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('Profile'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('applies active styling to current path', () => {
    render(<NavigationDrawer {...defaultProps} />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink?.className).toContain('bg-amber-50');
  });

  it('applies translate-x-0 when open', () => {
    const { container } = render(<NavigationDrawer {...defaultProps} isOpen={true} />);
    const drawer = container.querySelector('.translate-x-0');
    expect(drawer).toBeInTheDocument();
  });

  it('applies -translate-x-full when closed', () => {
    const { container } = render(<NavigationDrawer {...defaultProps} isOpen={false} />);
    const drawer = container.querySelector('.-translate-x-full');
    expect(drawer).toBeInTheDocument();
  });
});
