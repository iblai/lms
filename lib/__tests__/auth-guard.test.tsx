import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';

// Mock the useDefineUserTenants hook used by auth-guard.ts
const mockUseDefineUserTenants = vi.fn(() => ({ tenantsLoading: false }));
vi.mock('@/hooks/platform/use-define-user-tenants', () => ({
  useDefineUserTenants: () => mockUseDefineUserTenants(),
}));

import { AuthGuard } from '../auth-guard';

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDefineUserTenants.mockReturnValue({ tenantsLoading: false });
  });

  describe('when tenants are loaded (not loading)', () => {
    it('renders children', () => {
      render(
        <AuthGuard>
          <div data-testid="child">Protected Content</div>
        </AuthGuard>,
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders children without fallback prop', () => {
      render(
        <AuthGuard>
          <span>Main Content</span>
        </AuthGuard>,
      );

      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('renders children even when fallback is provided', () => {
      render(
        <AuthGuard fallback={<div data-testid="fallback">Loading...</div>}>
          <div data-testid="child">Protected</div>
        </AuthGuard>,
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
    });

    it('accepts and renders multiple children', () => {
      render(
        <AuthGuard>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
        </AuthGuard>,
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('when tenants are loading', () => {
    beforeEach(() => {
      mockUseDefineUserTenants.mockReturnValue({ tenantsLoading: true });
    });

    it('renders fallback when provided', () => {
      render(
        <AuthGuard fallback={<div data-testid="fallback">Loading...</div>}>
          <div data-testid="child">Protected Content</div>
        </AuthGuard>,
      );

      expect(screen.getByTestId('fallback')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    });

    it('renders default "Loading..." text when no fallback is provided', () => {
      render(
        <AuthGuard>
          <div data-testid="child">Protected Content</div>
        </AuthGuard>,
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    });

    it('does not render children', () => {
      render(
        <AuthGuard>
          <div data-testid="child">Secret</div>
        </AuthGuard>,
      );

      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    });
  });

  describe('transition from loading to loaded', () => {
    it('switches from fallback to children when loading completes', () => {
      mockUseDefineUserTenants.mockReturnValue({ tenantsLoading: true });

      const { rerender } = render(
        <AuthGuard fallback={<div data-testid="fallback">Loading...</div>}>
          <div data-testid="child">Content</div>
        </AuthGuard>,
      );

      expect(screen.getByTestId('fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('child')).not.toBeInTheDocument();

      // Simulate loading complete
      mockUseDefineUserTenants.mockReturnValue({ tenantsLoading: false });

      rerender(
        <AuthGuard fallback={<div data-testid="fallback">Loading...</div>}>
          <div data-testid="child">Content</div>
        </AuthGuard>,
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
    });
  });

  it('calls useDefineUserTenants hook', () => {
    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>,
    );

    expect(mockUseDefineUserTenants).toHaveBeenCalled();
  });
});
