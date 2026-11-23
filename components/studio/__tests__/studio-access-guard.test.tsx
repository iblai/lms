import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
vi.mock('@/hooks/use-tenant-param', () => ({ useTenantParam: () => 'acme' }));
vi.mock('@/utils/helpers', () => ({
  getErrorPageUrl: (code: number, tenant: string) => `/error/${code}?tenant=${tenant}`,
}));

const state = vi.hoisted(() => ({
  flag: true,
  instructorMode: true,
  canCreateCourse: false,
  creatorResolved: true,
  memberCheck: { data: undefined as any, isSuccess: true, isError: false },
}));
vi.mock('@/lib/config', () => ({
  config: { settings: { studioHeaderMenuEnabled: () => state.flag } },
}));
vi.mock('@/hooks/use-learner-mode', () => ({
  useLearnerMode: () => ({ isInstructorMode: state.instructorMode }),
}));
vi.mock('@/components/course-creation-access-guard', () => ({
  useCanCreateCourse: () => ({
    canCreateCourse: state.canCreateCourse,
    resolved: state.creatorResolved,
  }),
}));
vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: () => state.memberCheck,
}));

import { StudioAccessGuard } from '../studio-access-guard';

const renderGuard = () =>
  render(
    <StudioAccessGuard>
      <div data-testid="studio-content" />
    </StudioAccessGuard>,
  );

describe('StudioAccessGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.flag = true;
    state.instructorMode = true;
    state.canCreateCourse = false;
    state.creatorResolved = true;
    state.memberCheck = { data: { is_platform_admin: true }, isSuccess: true, isError: false };
  });

  it('renders Studio for a platform admin', () => {
    renderGuard();
    expect(screen.getByTestId('studio-content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders Studio for a department admin', () => {
    state.memberCheck = { data: { is_department_admin: true }, isSuccess: true, isError: false };
    renderGuard();
    expect(screen.getByTestId('studio-content')).toBeInTheDocument();
  });

  it('renders Studio for a non-admin who may create courses', () => {
    state.memberCheck = { data: {}, isSuccess: true, isError: false };
    state.canCreateCourse = true;
    renderGuard();
    expect(screen.getByTestId('studio-content')).toBeInTheDocument();
  });

  it('redirects a learner to the 403 page', () => {
    state.memberCheck = { data: {}, isSuccess: true, isError: false };
    renderGuard();
    expect(screen.queryByTestId('studio-content')).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/error/403?tenant=acme');
  });

  it('redirects an admin previewing the learner view', () => {
    state.instructorMode = false;
    renderGuard();
    expect(mockReplace).toHaveBeenCalledWith('/error/403?tenant=acme');
  });

  it('redirects everyone when the Studio flag is off', () => {
    state.flag = false;
    renderGuard();
    expect(mockReplace).toHaveBeenCalledWith('/error/403?tenant=acme');
  });

  it('redirects once a failed admin lookup has settled', () => {
    state.memberCheck = { data: undefined, isSuccess: false, isError: true };
    renderGuard();
    expect(mockReplace).toHaveBeenCalledWith('/error/403?tenant=acme');
  });

  it('holds on a spinner while the admin lookup is pending', () => {
    state.memberCheck = { data: undefined, isSuccess: false, isError: false };
    renderGuard();
    expect(screen.getByTestId('studio-access-pending')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('holds on a spinner while the stored tenant is unresolved', () => {
    state.memberCheck = { data: {}, isSuccess: true, isError: false };
    state.creatorResolved = false;
    renderGuard();
    expect(screen.getByTestId('studio-access-pending')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
