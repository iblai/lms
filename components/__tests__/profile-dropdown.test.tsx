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

import { ProfileDropdown } from '../profile-dropdown';

describe('ProfileDropdown', () => {
  const defaultProps = {
    onClose: vi.fn(),
    onAccountClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ProfileDropdown {...defaultProps} />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders Profile link', () => {
    render(<ProfileDropdown {...defaultProps} />);
    const profileLink = screen.getByText('Profile').closest('a');
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  it('renders Account button', () => {
    render(<ProfileDropdown {...defaultProps} />);
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('renders Log Out button', () => {
    render(<ProfileDropdown {...defaultProps} />);
    expect(screen.getByText('Log Out')).toBeInTheDocument();
  });

  it('calls onClose when Profile link is clicked', () => {
    render(<ProfileDropdown {...defaultProps} />);
    fireEvent.click(screen.getByText('Profile'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onAccountClick and onClose when Account is clicked', () => {
    render(<ProfileDropdown {...defaultProps} />);
    fireEvent.click(screen.getByText('Account'));
    expect(defaultProps.onAccountClick).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when Log Out is clicked', () => {
    render(<ProfileDropdown {...defaultProps} />);
    fireEvent.click(screen.getByText('Log Out'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes when clicking outside the dropdown', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <ProfileDropdown {...defaultProps} />
      </div>,
    );
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not close when clicking inside the dropdown', () => {
    render(<ProfileDropdown {...defaultProps} />);
    fireEvent.mouseDown(screen.getByText('Account'));
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});
