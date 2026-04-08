import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSetActiveTab = vi.fn();
const mockRedirect = vi.fn();
const mockUseGetDepartmentMemberCheckQuery = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

vi.mock('@/components/edx-iframe/edx-iframe', () => ({
  EdxIframe: () => <div data-testid="edx-iframe" />,
}));

vi.mock('@/hooks/courses/edx-iframe-context', () => ({
  EdxIframeContext: React.createContext({
    setActiveTab: (...args: unknown[]) => mockSetActiveTab(...args),
  }),
}));

vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: (args: unknown) => mockUseGetDepartmentMemberCheckQuery(args),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: () => 'test-tenant',
}));

import GradebookTab from '@/app/course-content/[course_id]/gradebook/page';

describe('GradebookTab page', () => {
  beforeEach(() => {
    mockSetActiveTab.mockClear();
    mockRedirect.mockClear();
    mockUseGetDepartmentMemberCheckQuery.mockReset();
  });

  it('renders the EdxIframe', () => {
    mockUseGetDepartmentMemberCheckQuery.mockReturnValue({
      data: { is_platform_admin: true },
      isSuccess: true,
    });
    const { getByTestId } = render(<GradebookTab />);
    expect(getByTestId('edx-iframe')).toBeTruthy();
  });

  it('queries department member check with current tenant', () => {
    mockUseGetDepartmentMemberCheckQuery.mockReturnValue({
      data: undefined,
      isSuccess: false,
    });
    render(<GradebookTab />);
    expect(mockUseGetDepartmentMemberCheckQuery).toHaveBeenCalledWith({
      platform_key: 'test-tenant',
    });
  });

  it('sets active tab to gradebook for platform admins', () => {
    mockUseGetDepartmentMemberCheckQuery.mockReturnValue({
      data: { is_platform_admin: true },
      isSuccess: true,
    });
    render(<GradebookTab />);
    expect(mockSetActiveTab).toHaveBeenCalledWith('gradebook');
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects non-admin users to /', () => {
    mockUseGetDepartmentMemberCheckQuery.mockReturnValue({
      data: { is_platform_admin: false },
      isSuccess: true,
    });
    render(<GradebookTab />);
    expect(mockRedirect).toHaveBeenCalledWith('/');
    expect(mockSetActiveTab).not.toHaveBeenCalled();
  });

  it('does nothing while query is not yet successful', () => {
    mockUseGetDepartmentMemberCheckQuery.mockReturnValue({
      data: undefined,
      isSuccess: false,
    });
    render(<GradebookTab />);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockSetActiveTab).not.toHaveBeenCalled();
  });
});
