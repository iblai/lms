import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const { mockRedirect } = vi.hoisted(() => ({ mockRedirect: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

const capturedProps: { value?: any } = {};
vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  CourseContentTabPage: (props: any) => {
    capturedProps.value = props;
    return <div data-testid="course-content-tab-page" data-tab={props.tab} />;
  },
}));

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetDepartmentMemberCheckQuery: vi.fn(() => ({
    data: { is_platform_admin: true },
    isSuccess: true,
  })),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      lms: () => 'https://lms.test',
      mfe: () => 'https://mfe.test',
      legacyLmsUrl: () => 'https://legacy-lms.test',
    },
  },
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

import InstructorTab from '../page';
import { useGetDepartmentMemberCheckQuery } from '@iblai/iblai-js/data-layer';
import { getTenant } from '@/utils/helpers';

describe('InstructorTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProps.value = undefined;
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: true },
      isSuccess: true,
    } as any);
  });

  it('renders the shared CourseContentTabPage', () => {
    render(<InstructorTab />);
    expect(screen.getByTestId('course-content-tab-page')).toBeInTheDocument();
  });

  it('passes tab="instructor" to the shared component', () => {
    render(<InstructorTab />);
    expect(capturedProps.value?.tab).toBe('instructor');
  });

  it('passes lmsUrl, mfeUrl, and legacyLmsUrl from config', () => {
    render(<InstructorTab />);
    expect(capturedProps.value?.lmsUrl).toBe('https://lms.test');
    expect(capturedProps.value?.mfeUrl).toBe('https://mfe.test');
    expect(capturedProps.value?.legacyLmsUrl).toBe('https://legacy-lms.test');
  });

  it('calls useGetDepartmentMemberCheckQuery with tenant platform_key', () => {
    render(<InstructorTab />);
    expect(useGetDepartmentMemberCheckQuery).toHaveBeenCalledWith({
      platform_key: 'test-tenant',
    });
    expect(getTenant).toHaveBeenCalled();
  });

  it('does not redirect when user is a platform admin', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: true },
      isSuccess: true,
    } as any);

    render(<InstructorTab />);

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects to / when query succeeded and user is not a platform admin', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
      isSuccess: true,
    } as any);

    render(<InstructorTab />);

    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('redirects to / when query succeeded and data is undefined', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: undefined,
      isSuccess: true,
    } as any);

    render(<InstructorTab />);

    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('does not redirect while query is pending (isSuccess=false)', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: undefined,
      isSuccess: false,
    } as any);

    render(<InstructorTab />);

    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
