import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: { dm: () => 'https://dm.test' },
    settings: { courseEligibilityEnabled: () => false },
  },
}));

const mockSetCourseMentor = vi.fn();
vi.mock('@/components/chat-button', () => ({
  useChatState: vi.fn(() => ({ setCourseMentor: mockSetCourseMentor })),
}));

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetDepartmentMemberCheckQuery: vi.fn(() => ({
    data: { is_platform_admin: false },
  })),
}));

const capturedProps: { value?: any } = {};
vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  CourseContentLayout: (props: any) => {
    capturedProps.value = props;
    return (
      <div data-testid="shared-course-content-layout" data-course-id={props.courseId}>
        {props.children}
      </div>
    );
  },
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof React>('react');
  return {
    ...actual,
    use: vi.fn((value: any) => value),
  };
});

import CourseContentLayout from '../layout';
import { useGetDepartmentMemberCheckQuery } from '@iblai/iblai-js/data-layer';

describe('CourseContentLayout', () => {
  const params = { course_id: 'course-v1%3Atest%2Bcourse%2B2024' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedProps.value = undefined;
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);
  });

  it('renders without crashing', () => {
    const { container } = render(
      <CourseContentLayout params={params}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(container).toBeTruthy();
  });

  it('renders the shared SDK layout', () => {
    render(
      <CourseContentLayout params={params}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(screen.getByTestId('shared-course-content-layout')).toBeInTheDocument();
  });

  it('renders children within the shared layout', () => {
    render(
      <CourseContentLayout params={params}>
        <div data-testid="page-content">Page Content</div>
      </CourseContentLayout>,
    );
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('decodes the course_id from params', () => {
    render(
      <CourseContentLayout params={params}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(capturedProps.value?.courseId).toBe('course-v1:test+course+2024');
  });

  it('passes current tenant to shared layout', () => {
    render(
      <CourseContentLayout params={params}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(capturedProps.value?.currentTenant).toBe('test-tenant');
  });

  it('passes isPlatformAdmin=false when user is not a platform admin', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);
    render(
      <CourseContentLayout params={params}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(capturedProps.value?.isPlatformAdmin).toBe(false);
  });

  it('passes isPlatformAdmin=true when user is a platform admin', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: true },
    } as any);
    render(
      <CourseContentLayout params={params}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(capturedProps.value?.isPlatformAdmin).toBe(true);
  });

  it('maps forum tab href to discussion', () => {
    render(
      <CourseContentLayout params={params}>
        <div>children</div>
      </CourseContentLayout>,
    );
    const href = capturedProps.value?.tabHrefTemplate({ courseId: 'c1', tab: 'forum' });
    expect(href).toBe('/course-content/c1/discussion');
  });

  it('keeps non-forum tabs as-is in href template', () => {
    render(
      <CourseContentLayout params={params}>
        <div>children</div>
      </CourseContentLayout>,
    );
    const href = capturedProps.value?.tabHrefTemplate({ courseId: 'c1', tab: 'progress' });
    expect(href).toBe('/course-content/c1/progress');
  });

  it('pushes to /error/403 on unauthorized', () => {
    render(
      <CourseContentLayout params={params}>
        <div>children</div>
      </CourseContentLayout>,
    );
    capturedProps.value?.onUnauthorized();
    expect(mockRouterPush).toHaveBeenCalledWith('/error/403');
  });

  it('pushes to /error/404 on not found', () => {
    render(
      <CourseContentLayout params={params}>
        <div>children</div>
      </CourseContentLayout>,
    );
    capturedProps.value?.onNotFound();
    expect(mockRouterPush).toHaveBeenCalledWith('/error/404');
  });

  it('uses router.push for internal navigation', () => {
    render(
      <CourseContentLayout params={params}>
        <div>children</div>
      </CourseContentLayout>,
    );
    capturedProps.value?.onNavigate('/some/path');
    expect(mockRouterPush).toHaveBeenCalledWith('/some/path');
  });

  it('hooks onCourseMentorChange to setCourseMentor from chat state', () => {
    render(
      <CourseContentLayout params={params}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(capturedProps.value?.onCourseMentorChange).toBe(mockSetCourseMentor);
  });
});
