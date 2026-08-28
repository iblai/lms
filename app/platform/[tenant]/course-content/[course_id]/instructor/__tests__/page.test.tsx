import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// The course iframe — stub it so the test stays on the access-control logic.
vi.mock('@/components/edx-iframe/edx-iframe', () => ({
  EdxIframe: () => <div data-testid="edx-iframe" />,
}));

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

import InstructorTab from '../page';

function renderPage() {
  return render(<InstructorTab />);
}

const staffRoles = (role: string) => ({
  courseRoles: [{ role, org: 'test-tenant', course: 'course-v1:test+course+2024' }],
  isCourseStaff: role !== 'course-limited-staff',
  isCourseLimitedStaff: role === 'course-limited-staff',
  hasCourseStaffAccess: true,
  isResolved: true,
});

describe('InstructorTab', () => {
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

  it('renders the course iframe for a platform admin', () => {
    renderPage();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(screen.getByTestId('edx-iframe')).toBeInTheDocument();
  });

  it('redirects a resolved non-staff user away from the page', () => {
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
    'admits a non-admin holding the %s role',
    (role) => {
      mockMemberCheck.mockReturnValue({ data: { is_platform_admin: false }, isSuccess: true });
      mockCourseUserRoles.mockReturnValue(staffRoles(role));
      renderPage();
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(screen.getByTestId('edx-iframe')).toBeInTheDocument();
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
