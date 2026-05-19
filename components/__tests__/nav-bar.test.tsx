import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  useRouter: vi.fn(() => ({ push: mockPush })),
  useSearchParams: vi.fn(() => mockSearchParams),
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
  getUserName: vi.fn(() => 'test-user'),
  isRecommendedTabHidden: vi.fn(() => false),
}));

vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: vi.fn(() => ({
    data: { is_platform_admin: false, is_department_admin: false },
  })),
}));

vi.mock('../logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

vi.mock('../header/profile/user-profile-button', () => ({
  UserProfileButton: () => <div data-testid="user-profile-button">Profile</div>,
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  NotificationDropdown: () => <div data-testid="notification-dropdown">Notifications</div>,
}));

vi.mock('react-responsive', () => ({
  useMediaQuery: vi.fn(({ minWidth, maxWidth }: any) => {
    if (minWidth === 915 && !maxWidth) return true; // isDesktop
    return false;
  }),
}));

vi.mock('@/hoc', () => ({
  WithPermissions: ({ children }: any) => children({ hasPermission: false }),
}));

import { NavBar } from '../nav-bar';

describe('NavBar', () => {
  const defaultProps = {
    sidebarOpen: false,
    activePage: 'home',
    onMenuClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByTestId('logo')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    // Profile text appears both in nav link and UserProfileButton mock
    expect(screen.getAllByText('Profile').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Discover')).toBeInTheDocument();
  });

  it('renders Recommended link when not hidden', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('hides Recommended link when isRecommendedTabHidden returns true', async () => {
    const { isRecommendedTabHidden } = await import('@/utils/helpers');
    vi.mocked(isRecommendedTabHidden).mockReturnValue(true);
    render(<NavBar {...defaultProps} />);
    expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
  });

  it('applies active styling to active page link', () => {
    render(<NavBar {...defaultProps} activePage="home" />);
    const homeLink = screen.getByText('Home');
    expect(homeLink.className).toContain('border-b-2');
  });

  it('calls onMenuClick when menu button is clicked', () => {
    render(<NavBar {...defaultProps} />);
    const menuButton = screen.getByLabelText('Open sidebar');
    fireEvent.click(menuButton);
    expect(defaultProps.onMenuClick).toHaveBeenCalled();
  });

  it('renders search input on desktop', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('renders user profile button', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByTestId('user-profile-button')).toBeInTheDocument();
  });

  it('renders notification dropdown', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });

  it('submits search form on desktop', () => {
    render(<NavBar {...defaultProps} activePage="discover" />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'test query' } });
    const form = input.closest('form')!;
    fireEvent.submit(form);
    expect(mockPush).toHaveBeenCalled();
  });
});
