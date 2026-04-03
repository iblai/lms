import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      enableGravatarOnProfilePic: vi.fn(() => 'true'),
    },
  },
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  Profile: (props: any) => (
    <div data-testid="profile-component">
      <span data-testid="profile-tenant">{props.tenant}</span>
      <span data-testid="profile-username">{props.username}</span>
    </div>
  ),
  InviteUserDialog: (props: any) => (
    <div data-testid="invite-user-dialog">
      <button data-testid="close-invite" onClick={() => props.onClose()}>
        Close Invite
      </button>
    </div>
  ),
  InvitedUsersDialog: (props: any) => (
    <div data-testid="invited-users-dialog">
      <button data-testid="close-invited" onClick={() => props.onClose()}>
        Close Invited
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) =>
    open ? (
      <div data-testid="dialog">
        <button data-testid="dialog-open-change" onClick={() => onOpenChange(false)}>
          Toggle
        </button>
        {children}
      </div>
    ) : null,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
}));

import { UserProfileModal } from '../user-profile-modal';

describe('UserProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(<UserProfileModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog when open', () => {
    render(<UserProfileModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('renders Profile component with correct tenant', () => {
    render(<UserProfileModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('profile-tenant')).toHaveTextContent('test-tenant');
  });

  it('renders Profile component with correct username', () => {
    render(<UserProfileModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('profile-username')).toHaveTextContent('test-user');
  });

  it('calls onClose when dialog open changes', () => {
    const onClose = vi.fn();
    render(<UserProfileModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('dialog-open-change'));
    expect(onClose).toHaveBeenCalled();
  });
});
