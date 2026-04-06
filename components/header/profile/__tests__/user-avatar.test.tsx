import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAvatar } from '../user-avatar';

// Mutable state for per-test control
let mockUserMetaData: any = null;
let mockUserMetaDataLoading = false;
let mockEnableGravatar = 'true';

vi.mock('@/hooks/users/use-usermetadata', () => ({
  useUserMetadata: () => ({
    userMetaData: mockUserMetaData,
    userMetaDataLoading: mockUserMetaDataLoading,
  }),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      enableGravatarOnProfilePic: () => mockEnableGravatar,
    },
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) =>
    args
      .flat()
      .filter((v) => typeof v === 'string' && v.length > 0)
      .join(' '),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  getInitials: (name: string) => (name ? name.substring(0, 2).toUpperCase() : ''),
}));

vi.mock('react-gravatar', () => ({
  default: ({ email }: { email: string }) => (
    <img data-testid="gravatar" alt={`gravatar-${email}`} />
  ),
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => (
    <div data-testid="avatar" className={className}>
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt }: any) => <img data-testid="avatar-image" src={src} alt={alt} />,
  AvatarFallback: ({ children, className }: any) => (
    <div data-testid="avatar-fallback" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

describe('UserAvatar', () => {
  beforeEach(() => {
    mockUserMetaData = null;
    mockUserMetaDataLoading = false;
    mockEnableGravatar = 'true';
  });

  describe('loading state', () => {
    it('shows skeleton while user metadata is loading', () => {
      mockUserMetaDataLoading = true;
      render(<UserAvatar />);

      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
      expect(screen.queryByTestId('gravatar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('avatar-fallback')).not.toBeInTheDocument();
    });
  });

  describe('when user has a profile image', () => {
    beforeEach(() => {
      mockUserMetaData = {
        profile_image: { has_image: true, image_url_large: 'https://example.com/photo.jpg' },
        name: 'Jane Doe',
        email: 'jane@example.com',
      };
    });

    it('renders the profile image', () => {
      render(<UserAvatar />);

      expect(screen.getByTestId('avatar-image')).toHaveAttribute(
        'src',
        'https://example.com/photo.jpg',
      );
    });

    it('does not render gravatar when profile image is present', () => {
      render(<UserAvatar />);

      expect(screen.queryByTestId('gravatar')).not.toBeInTheDocument();
    });

    it('shows the fallback with initials (not hidden) when profile image is present', () => {
      render(<UserAvatar />);

      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toBeInTheDocument();
      expect(fallback.className).not.toContain('hidden');
    });
  });

  describe('when user has no profile image and gravatar is enabled', () => {
    beforeEach(() => {
      mockEnableGravatar = 'true';
      mockUserMetaData = {
        profile_image: { has_image: false },
        name: 'John Smith',
        email: 'john@example.com',
      };
    });

    it('renders gravatar', () => {
      render(<UserAvatar />);

      expect(screen.getByTestId('gravatar')).toBeInTheDocument();
    });

    it('does not render the avatar image', () => {
      render(<UserAvatar />);

      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
    });

    it('hides the fallback when gravatar is shown', () => {
      render(<UserAvatar />);

      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback.className).toContain('hidden');
    });
  });

  describe('when user has no profile image and gravatar is disabled', () => {
    beforeEach(() => {
      mockEnableGravatar = 'false';
      mockUserMetaData = {
        profile_image: { has_image: false },
        name: 'Alice',
        email: 'alice@example.com',
        username: 'alice123',
      };
    });

    it('does not render gravatar', () => {
      render(<UserAvatar />);

      expect(screen.queryByTestId('gravatar')).not.toBeInTheDocument();
    });

    it('does not render the avatar image', () => {
      render(<UserAvatar />);

      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
    });

    it('shows the fallback (not hidden) when gravatar is disabled', () => {
      render(<UserAvatar />);

      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback.className).not.toContain('hidden');
    });

    it('shows initials derived from the user name', () => {
      render(<UserAvatar />);

      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('AL');
    });
  });

  describe('initials fallback priority', () => {
    it('uses name for initials when available', () => {
      mockEnableGravatar = 'false';
      mockUserMetaData = {
        profile_image: { has_image: false },
        name: 'Bob',
        username: 'bobuser',
        email: 'bob@example.com',
      };
      render(<UserAvatar />);

      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('BO');
    });

    it('falls back to username when name is absent', () => {
      mockEnableGravatar = 'false';
      mockUserMetaData = {
        profile_image: { has_image: false },
        name: '',
        username: 'charlie',
        email: 'charlie@example.com',
      };
      render(<UserAvatar />);

      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('CH');
    });

    it('falls back to email when name and username are absent', () => {
      mockEnableGravatar = 'false';
      mockUserMetaData = {
        profile_image: { has_image: false },
        name: '',
        username: '',
        email: 'dave@example.com',
      };
      render(<UserAvatar />);

      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('DA');
    });
  });

  describe('gravatar disabled via any non-"false" value', () => {
    it('treats any value other than "false" as enabled', () => {
      mockEnableGravatar = 'true';
      mockUserMetaData = { profile_image: { has_image: false }, email: 'x@example.com' };
      render(<UserAvatar />);

      expect(screen.getByTestId('gravatar')).toBeInTheDocument();
    });
  });
});
