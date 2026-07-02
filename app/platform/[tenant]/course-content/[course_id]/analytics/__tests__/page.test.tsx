import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// AnalyticsCourseDetail from the SDK — stub it and echo its props so we can assert wiring.
vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsCourseDetail: (props: any) => (
    <div data-testid="analytics-course-detail" data-props={JSON.stringify(props)} />
  ),
}));

// next/navigation
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' }),
  useRouter: () => ({ push: mockRouterPush }),
}));

// Tenant param
vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'test-tenant',
}));

// RBAC plumbing
vi.mock('@/lib/hooks', () => ({
  useAppSelector: (selector: any) => selector({ rbac: { rbacPermissions: {} } }),
}));
vi.mock('@/features/rbac', () => ({
  selectRbacPermissions: (state: any) => state.rbac.rbacPermissions,
}));
const mockCheckRbacPermission = vi.fn((..._args: any[]) => true);
vi.mock('@/hoc', () => ({
  checkRbacPermission: (...args: any[]) => mockCheckRbacPermission(...args),
}));

// Department member check — used purely as a "permissions resolved" signal
const mockMemberCheck = vi.fn((..._args: any[]) => ({ isSuccess: true, isError: false }));
vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: (...args: any[]) => mockMemberCheck(...args),
}));

// Contexts — export real React contexts so the page's useContext works with a Provider
vi.mock('@/contexts/course-outline-context', () => ({
  CourseOutlineContext: React.createContext<any>({ course: null }),
}));
vi.mock('@/hooks/courses/edx-iframe-context', () => ({
  EdxIframeContext: React.createContext<any>({ setActiveTab: () => {} }),
}));

import AnalyticsPage from '../page';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';

const mockSetActiveTab = vi.fn();

function renderPage(course: any = { display_name: 'Test Course' }) {
  return render(
    <CourseOutlineContext.Provider value={{ course } as any}>
      <EdxIframeContext.Provider value={{ setActiveTab: mockSetActiveTab } as any}>
        <AnalyticsPage />
      </EdxIframeContext.Provider>
    </CourseOutlineContext.Provider>,
  );
}

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRbacPermission.mockReturnValue(true);
    mockMemberCheck.mockReturnValue({ isSuccess: true, isError: false });
  });

  it('renders AnalyticsCourseDetail when the user has can_view_analytics', () => {
    renderPage();
    expect(screen.getByTestId('analytics-course-detail')).toBeInTheDocument();
  });

  it('checks the can_view_analytics RBAC resource for the tenant', () => {
    renderPage();
    expect(mockCheckRbacPermission).toHaveBeenCalledWith(
      expect.anything(),
      '/platforms/test-tenant/#can_view_analytics',
    );
  });

  it('passes the decoded courseId, tenant, and course name to AnalyticsCourseDetail', () => {
    renderPage({ display_name: 'My Course' });
    const props = JSON.parse(
      screen.getByTestId('analytics-course-detail').getAttribute('data-props') || '{}',
    );
    expect(props.tenantKey).toBe('test-tenant');
    expect(props.courseId).toBe('course-v1:test+course+2024');
    expect(props.courseName).toBe('My Course');
    expect(props.showCourseTitle).toBe(false);
  });

  it('announces analytics as the active tab on mount', () => {
    renderPage();
    expect(mockSetActiveTab).toHaveBeenCalledWith('analytics');
  });

  it('redirects to the 403 error page when resolved and the permission is missing', () => {
    mockCheckRbacPermission.mockReturnValue(false);
    renderPage();
    expect(mockRouterPush).toHaveBeenCalledWith('/platform/test-tenant/error/403');
    expect(screen.queryByTestId('analytics-course-detail')).not.toBeInTheDocument();
  });

  it('shows a spinner and does not redirect while permissions are still resolving', () => {
    mockCheckRbacPermission.mockReturnValue(false);
    mockMemberCheck.mockReturnValue({ isSuccess: false, isError: false });
    const { container } = renderPage();
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByTestId('analytics-course-detail')).not.toBeInTheDocument();
  });
});
