import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { StartPageContext } from '@/hooks/start/start-page-context';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockHandleRolesFetch = vi.fn();
const mockUseStartPage = vi.fn();

vi.mock('@/hooks/start/use-start-page', () => ({
  useStartPage: () => mockUseStartPage(),
}));

vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: any) => fn,
}));

vi.mock('../../skeleton-multiplier', () => ({
  SkeletonMultiplier: ({ multiplier }: any) => (
    <div data-testid="skeleton-multiplier">{multiplier}</div>
  ),
}));

vi.mock('../../skeleton-role-box', () => ({
  SkeletonRoleBox: () => <div data-testid="skeleton-role-box" />,
}));

vi.mock('../../default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: any) => <div data-testid="empty-box">{message}</div>,
}));

import RoleSelectionSlide from '../RoleSelectionSlide';

const defaultContextValue = {
  fields: {
    roles: [],
    skills: [],
    resume: null,
    profileImage: null,
    socialLinks: { linkedin: '', twitter: '', facebook: '' },
  },
  setFields: vi.fn(),
  handleToggleRole: vi.fn(),
  isRoleSelected: vi.fn(() => false),
  handleToggleSkill: vi.fn(),
  isSkillSelected: vi.fn(() => false),
  handleUpdateSkillRating: vi.fn(),
  handleProfileImageSelect: vi.fn(),
  profileImage: null,
  handleSocialLinksUpdate: vi.fn(),
  handleFileUpload: vi.fn(),
};

const renderSlide = (contextOverrides = {}) => {
  return render(
    <StartPageContext.Provider value={{ ...defaultContextValue, ...contextOverrides }}>
      <RoleSelectionSlide />
    </StartPageContext.Provider>,
  );
};

describe('RoleSelectionSlide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStartPage.mockReturnValue({
      handleRolesFetch: mockHandleRolesFetch,
      roles: [],
      rolesLoading: false,
    });
  });

  it('renders without crashing', () => {
    const { container } = renderSlide();
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays the title', () => {
    renderSlide();
    expect(screen.getByText('Select Your Role')).toBeInTheDocument();
  });

  it('displays search input', () => {
    renderSlide();
    expect(screen.getByPlaceholderText('Search for a role')).toBeInTheDocument();
  });

  it('shows 0 Selected Roles initially', () => {
    renderSlide();
    expect(screen.getByText('0 Selected Roles')).toBeInTheDocument();
  });

  it('shows selected roles count', () => {
    renderSlide({
      fields: {
        ...defaultContextValue.fields,
        roles: [{ data: { id: 1, name: 'Engineer' } }, { data: { id: 2, name: 'Manager' } }],
      },
    });
    expect(screen.getByText('2 Selected Roles')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    mockUseStartPage.mockReturnValue({
      handleRolesFetch: mockHandleRolesFetch,
      roles: [],
      rolesLoading: true,
    });
    renderSlide();
    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
  });

  it('shows empty box when no roles found', () => {
    renderSlide();
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
    expect(screen.getByText('No roles found.')).toBeInTheDocument();
  });

  it('shows empty box with search query text', () => {
    renderSlide();
    const input = screen.getByPlaceholderText('Search for a role');
    fireEvent.change(input, { target: { value: 'developer' } });
    expect(screen.getByText('No roles matching "developer" found.')).toBeInTheDocument();
  });

  it('renders roles when available', () => {
    mockUseStartPage.mockReturnValue({
      handleRolesFetch: mockHandleRolesFetch,
      roles: [
        { data: { id: 1, name: 'Software Engineer' } },
        { data: { id: 2, name: 'Data Scientist', data: { description: 'Analyzes data' } } },
      ],
      rolesLoading: false,
    });
    renderSlide();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Data Scientist')).toBeInTheDocument();
    expect(screen.getByText('Analyzes data')).toBeInTheDocument();
  });

  it('calls handleToggleRole when a role is clicked', () => {
    const handleToggleRole = vi.fn();
    mockUseStartPage.mockReturnValue({
      handleRolesFetch: mockHandleRolesFetch,
      roles: [{ data: { id: 1, name: 'Engineer' } }],
      rolesLoading: false,
    });
    renderSlide({ handleToggleRole });
    fireEvent.click(screen.getByText('Engineer'));
    expect(handleToggleRole).toHaveBeenCalled();
  });

  it('highlights selected roles', () => {
    mockUseStartPage.mockReturnValue({
      handleRolesFetch: mockHandleRolesFetch,
      roles: [{ data: { id: 1, name: 'Engineer' } }],
      rolesLoading: false,
    });
    renderSlide({ isRoleSelected: vi.fn(() => true) });
    const roleCard = screen.getByText('Engineer').closest('div[class*="cursor-pointer"]');
    expect(roleCard?.className).toContain('border-amber-500');
  });

  it('calls handleRolesFetch on mount', () => {
    renderSlide();
    expect(mockHandleRolesFetch).toHaveBeenCalled();
  });
});
