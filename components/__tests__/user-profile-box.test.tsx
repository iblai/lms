import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/hooks/users/use-usermetadata', () => ({
  useUserMetadata: () => ({
    userMetaData: { name: 'John Doe' },
  }),
}));

vi.mock('@/components/header/profile/user-avatar', () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
}));

import { UserProfileBox } from '../user-profile-box';

describe('UserProfileBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<UserProfileBox />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays the user name', () => {
    render(<UserProfileBox />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders the user avatar', () => {
    render(<UserProfileBox />);
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('navigates to profile page when edit button is clicked', () => {
    render(<UserProfileBox />);
    const editButton = screen.getByRole('button');
    fireEvent.click(editButton);
    expect(mockPush).toHaveBeenCalledWith('/profile/public');
  });
});
