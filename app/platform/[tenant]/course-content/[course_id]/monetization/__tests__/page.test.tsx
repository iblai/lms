import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// The SDK component — stub it and echo props.
vi.mock('@iblai/iblai-js/web-containers', () => ({
  ItemMonetization: (props: any) => (
    <div
      data-testid="item-monetization"
      data-platform-key={props.platformKey}
      data-auth-url={props.authURL}
      data-item-type={props.itemType}
      data-item-id={props.itemId}
      data-item-name={props.itemName}
    />
  ),
}));

const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' }),
  redirect: (...args: any[]) => mockRedirect(...args),
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'test-tenant',
}));

vi.mock('@/lib/config', () => ({
  config: { urls: { auth: () => 'https://auth.example.com' } },
}));

vi.mock('@/contexts/course-outline-context', () => ({
  CourseOutlineContext: React.createContext({ course: { display_name: 'Intro to Testing' } }),
}));

const mockMemberCheck = vi.fn((..._args: any[]): any => ({
  data: { is_platform_admin: true },
  isSuccess: true,
}));
vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: (...args: any[]) => mockMemberCheck(...args),
}));

const mockCourseUserRoles = vi.fn((..._args: any[]): any => ({
  hasCourseStaffAccess: false,
  isResolved: true,
}));
vi.mock('@/hooks/courses/use-course-user-roles', () => ({
  useCourseUserRoles: (...args: any[]) => mockCourseUserRoles(...args),
}));

const mockCanSellItems = vi.fn((..._args: any[]) => true);
vi.mock('@/hooks/use-can-sell-items', () => ({
  useCanSellItems: (...args: any[]) => mockCanSellItems(...args),
}));

import MonetizationPage from '../page';

describe('MonetizationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMemberCheck.mockReturnValue({ data: { is_platform_admin: true }, isSuccess: true });
    mockCourseUserRoles.mockReturnValue({ hasCourseStaffAccess: false, isResolved: true });
    mockCanSellItems.mockReturnValue(true);
  });

  it('renders the course paywall for a platform admin who can sell', () => {
    render(<MonetizationPage />);
    const item = screen.getByTestId('item-monetization');
    expect(item).toHaveAttribute('data-platform-key', 'test-tenant');
    expect(item).toHaveAttribute('data-auth-url', 'https://auth.example.com');
    expect(item).toHaveAttribute('data-item-type', 'course');
    expect(item).toHaveAttribute('data-item-id', 'course-v1:test+course+2024');
    expect(item).toHaveAttribute('data-item-name', 'Intro to Testing');
    expect(mockCanSellItems).toHaveBeenCalledWith('test-tenant');
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('renders for course staff who can sell', () => {
    mockMemberCheck.mockReturnValue({ data: { is_platform_admin: false }, isSuccess: true });
    mockCourseUserRoles.mockReturnValue({ hasCourseStaffAccess: true, isResolved: true });
    render(<MonetizationPage />);
    expect(screen.getByTestId('item-monetization')).toBeInTheDocument();
  });

  it('redirects staff who cannot sell', () => {
    mockCanSellItems.mockReturnValue(false);
    render(<MonetizationPage />);
    expect(screen.queryByTestId('item-monetization')).not.toBeInTheDocument();
    expect(mockRedirect).toHaveBeenCalledWith('/platform/test-tenant');
  });

  it('redirects a learner', () => {
    mockMemberCheck.mockReturnValue({ data: { is_platform_admin: false }, isSuccess: true });
    render(<MonetizationPage />);
    expect(screen.queryByTestId('item-monetization')).not.toBeInTheDocument();
    expect(mockRedirect).toHaveBeenCalledWith('/platform/test-tenant');
  });

  it('holds the redirect while course roles are still loading', () => {
    mockMemberCheck.mockReturnValue({ data: { is_platform_admin: false }, isSuccess: true });
    mockCourseUserRoles.mockReturnValue({ hasCourseStaffAccess: false, isResolved: false });
    render(<MonetizationPage />);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
