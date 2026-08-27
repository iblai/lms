import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// The dynamically-imported ConfigurationTab — stub it and echo props.
vi.mock('@/app/platform/[tenant]/courses/[course_id]/_components/configuration-tab', () => ({
  ConfigurationTab: (props: any) => (
    <div data-testid="configuration-tab" data-course-id={props.courseId} />
  ),
}));

// next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' }),
  redirect: (...args: any[]) => mockRedirect(...args),
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'test-tenant',
}));

const mockMemberCheck = vi.fn((..._args: any[]): any => ({
  data: { is_platform_admin: true },
  isSuccess: true,
}));
vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: (...args: any[]) => mockMemberCheck(...args),
}));

// Course-scoped roles — course staff (full or limited) reach this tab too.
const mockCourseUserRoles = vi.fn((..._args: any[]): any => ({
  courseRoles: [],
  isCourseStaff: false,
  isCourseLimitedStaff: false,
  hasCourseStaffAccess: false,
  isResolved: true,
}));
vi.mock('@/hooks/courses/use-course-user-roles', () => ({
  useCourseUserRoles: (...args: any[]) => mockCourseUserRoles(...args),
}));

import ConfigurationPage from '../page';

function renderPage() {
  return render(<ConfigurationPage />);
}

describe('ConfigurationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMemberCheck.mockReturnValue({ data: { is_platform_admin: true }, isSuccess: true });
    mockCourseUserRoles.mockReturnValue({
      courseRoles: [],
      isCourseStaff: false,
      isCourseLimitedStaff: false,
      hasCourseStaffAccess: false,
      isResolved: true,
    });
  });

  it('renders the ConfigurationTab for a platform admin', async () => {
    renderPage();
    // ConfigurationTab is lazy-loaded via next/dynamic, so it resolves asynchronously.
    expect(await screen.findByTestId('configuration-tab')).toBeInTheDocument();
  });

  it('passes the decoded courseId to ConfigurationTab', async () => {
    renderPage();
    const tab = await screen.findByTestId('configuration-tab');
    expect(tab).toHaveAttribute('data-course-id', 'course-v1:test+course+2024');
  });

  it('renders nothing for a non-admin user', () => {
    mockMemberCheck.mockReturnValue({ data: { is_platform_admin: false }, isSuccess: true });
    const { container } = renderPage();
    expect(screen.queryByTestId('configuration-tab')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('redirects a resolved non-admin away from the page', () => {
    mockMemberCheck.mockReturnValue({ data: { is_platform_admin: false }, isSuccess: true });
    renderPage();
    expect(mockRedirect).toHaveBeenCalledWith('/platform/test-tenant');
  });

  it('does not redirect before the member check resolves', () => {
    mockMemberCheck.mockReturnValue({ data: undefined, isSuccess: false });
    renderPage();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('looks up course roles for the decoded course ID', () => {
    renderPage();
    expect(mockCourseUserRoles).toHaveBeenCalledWith('course-v1:test+course+2024');
  });

  it.each(['course-staff', 'course-instructor', 'course-limited-staff'])(
    'renders the ConfigurationTab for a non-admin with the %s role',
    async (role) => {
      mockMemberCheck.mockReturnValue({ data: { is_platform_admin: false }, isSuccess: true });
      mockCourseUserRoles.mockReturnValue({
        courseRoles: [{ role, org: 'test-tenant', course: 'course-v1:test+course+2024' }],
        isCourseStaff: role !== 'course-limited-staff',
        isCourseLimitedStaff: role === 'course-limited-staff',
        hasCourseStaffAccess: true,
        isResolved: true,
      });
      renderPage();
      expect(await screen.findByTestId('configuration-tab')).toBeInTheDocument();
      expect(mockRedirect).not.toHaveBeenCalled();
    },
  );

  it('does not redirect a non-admin before the course-role listing resolves', () => {
    mockMemberCheck.mockReturnValue({ data: { is_platform_admin: false }, isSuccess: true });
    mockCourseUserRoles.mockReturnValue({
      courseRoles: [],
      isCourseStaff: false,
      isCourseLimitedStaff: false,
      hasCourseStaffAccess: false,
      isResolved: false,
    });
    renderPage();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
