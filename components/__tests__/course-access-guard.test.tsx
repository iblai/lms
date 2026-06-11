import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockPathname = { current: '/course-content/course-v1:test+course+2024/course' };
vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => mockPathname.current,
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getTenants: vi.fn(() => []),
}));

const mockDispatch = vi.fn();
vi.mock('@/lib/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: vi.fn(),
}));

vi.mock('@/features/tenant', () => ({
  updateRequestedTenant: (key: string) => ({ type: 'tenant/updateRequestedTenant', payload: key }),
  selectRequestedTenant: vi.fn(),
}));

import { CourseAccessGuard } from '../course-access-guard';
import { getTenant, getTenants } from '@/utils/helpers';

describe('CourseAccessGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTenant).mockReturnValue('test-tenant');
    vi.mocked(getTenants).mockReturnValue([]);
  });

  describe('not-started state', () => {
    it('shows spinner when not started', () => {
      render(
        <CourseAccessGuard course={null} courseInfoLoadingState="not-started">
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(screen.queryByText('content')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('does not redirect when not started', () => {
      render(
        <CourseAccessGuard course={null} courseInfoLoadingState="not-started">
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows spinner while loading', () => {
      render(
        <CourseAccessGuard course={null} courseInfoLoadingState="loading">
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(screen.queryByText('content')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('does not redirect while still loading', () => {
      render(
        <CourseAccessGuard course={null} courseInfoLoadingState="loading">
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('authorized access', () => {
    it('renders children when course platform_key matches tenant', () => {
      render(
        <CourseAccessGuard
          course={{ platform_key: 'test-tenant' } as any}
          courseInfoLoadingState="successful"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('renders children when course platform_key is "main"', () => {
      render(
        <CourseAccessGuard
          course={{ platform_key: 'main' } as any}
          courseInfoLoadingState="successful"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('does not redirect when platform_key matches tenant', () => {
      render(
        <CourseAccessGuard
          course={{ platform_key: 'test-tenant' } as any}
          courseInfoLoadingState="successful"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not redirect when platform_key is "main"', () => {
      render(
        <CourseAccessGuard
          course={{ platform_key: 'main' } as any}
          courseInfoLoadingState="successful"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('mismatched platform_key', () => {
    // Tenant authorization is now resolved upstream by the `/platform/[tenant]`
    // routing, so the guard no longer gates on `platform_key` vs the active
    // tenant: a loaded course always renders its children without redirecting
    // to an error page or dispatching a requested-tenant change.
    it('renders children even when platform_key differs from the active tenant', () => {
      render(
        <CourseAccessGuard
          course={{ platform_key: 'other-tenant' } as any}
          courseInfoLoadingState="successful"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('does not redirect or dispatch when platform_key differs from the active tenant', () => {
      render(
        <CourseAccessGuard
          course={{ platform_key: 'other-tenant' } as any}
          courseInfoLoadingState="successful"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('course not found', () => {
    it('redirects to /error/404 when course is null after failure', () => {
      render(
        <CourseAccessGuard course={null} courseInfoLoadingState="failure">
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/error/404');
    });

    it('shows spinner instead of children when course is null', () => {
      render(
        <CourseAccessGuard course={null} courseInfoLoadingState="failure">
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(screen.queryByText('content')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('tab access', () => {
    it('silently redirects agent tab to course tab when agent_content_mode is false but course is accessible', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/agent';
      render(
        <CourseAccessGuard
          course={{ platform_key: 'test-tenant', agent_content_mode: false } as any}
          courseInfoLoadingState="successful"
          currentTab="agent"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockReplace).toHaveBeenCalledWith('/course-content/course-v1:test+course+2024/course');
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.queryByText('content')).not.toBeInTheDocument();
    });

    it('does not redirect on agent tab when agent_content_mode is true', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/agent';
      render(
        <CourseAccessGuard
          course={{ platform_key: 'test-tenant', agent_content_mode: true } as any}
          courseInfoLoadingState="successful"
          currentTab="agent"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('silently redirects agent tab to course tab when agent_content_mode is null', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/agent';
      render(
        <CourseAccessGuard
          course={{ platform_key: 'test-tenant', agent_content_mode: null } as any}
          courseInfoLoadingState="successful"
          currentTab="agent"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockReplace).toHaveBeenCalledWith('/course-content/course-v1:test+course+2024/course');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('redirects to /error/403 on agent tab when both tabs are inaccessible', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/agent';
      render(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              agent_content_mode: null,
              course_content_mode: false,
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="agent"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/error/403');
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('silently redirects course tab to agent tab when course_content_mode is false but agent is accessible', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/course';
      render(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              course_content_mode: false,
              agent_content_mode: true,
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="course"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockReplace).toHaveBeenCalledWith('/course-content/course-v1:test+course+2024/agent');
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.queryByText('content')).not.toBeInTheDocument();
    });

    it('redirects to /error/403 on course tab when both tabs are inaccessible', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/course';
      render(
        <CourseAccessGuard
          course={{ platform_key: 'test-tenant', course_content_mode: false } as any}
          courseInfoLoadingState="successful"
          currentTab="course"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/error/403');
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('does not redirect on course tab when course_content_mode is null', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/course';
      render(
        <CourseAccessGuard
          course={{ platform_key: 'test-tenant', course_content_mode: null } as any}
          courseInfoLoadingState="successful"
          currentTab="course"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('does not redirect on course tab when course_content_mode is true', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/course';
      render(
        <CourseAccessGuard
          course={{ platform_key: 'test-tenant', course_content_mode: true } as any}
          courseInfoLoadingState="successful"
          currentTab="course"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('does not redirect on course tab when both course_content_mode and agent_content_mode are false', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/course';
      render(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              course_content_mode: false,
              agent_content_mode: false,
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="course"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('does not redirect on other tabs regardless of content mode flags', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/progress';
      render(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              agent_content_mode: false,
              course_content_mode: false,
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="progress"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.getByText('content')).toBeInTheDocument();
    });
  });

  describe('content-mode audience access', () => {
    it('redirects non-admin to /error/403 on agent tab when agent audience is admins-only', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/agent';
      render(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              agent_content_mode: true,
              agent_content_mode_audience: ['admins'],
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="agent"
          isAdmin={false}
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/error/403');
      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.queryByText('content')).not.toBeInTheDocument();
    });

    it('redirects non-admin to /error/403 (not sibling) even when course tab is accessible', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/agent';
      render(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              agent_content_mode: true,
              agent_content_mode_audience: ['admins'],
              course_content_mode: true,
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="agent"
          isAdmin={false}
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/error/403');
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('renders agent tab for admin when agent audience is admins-only', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/agent';
      render(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              agent_content_mode: true,
              agent_content_mode_audience: ['admins'],
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="agent"
          isAdmin={true}
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('redirects non-admin to /error/403 on course tab when course audience is admins-only', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/course';
      render(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              course_content_mode: true,
              course_content_mode_audience: ['admins'],
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="course"
          isAdmin={false}
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/error/403');
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('renders for non-admin when audience is empty (defaults to learners)', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/agent';
      render(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              agent_content_mode: true,
              agent_content_mode_audience: [],
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="agent"
          isAdmin={false}
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('renders for non-admin when audience includes learners alongside admins', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/agent';
      render(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              agent_content_mode: true,
              agent_content_mode_audience: ['admins', 'learners'],
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="agent"
          isAdmin={false}
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('renders watchers-only agent tab for a watcher and 403s a non-watcher', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/agent';
      const { rerender } = render(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              agent_content_mode: true,
              agent_content_mode_audience: ['watchers'],
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="agent"
          isAdmin={false}
          isWatcher={true}
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByText('content')).toBeInTheDocument();

      rerender(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              agent_content_mode: true,
              agent_content_mode_audience: ['watchers'],
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="agent"
          isAdmin={false}
          isWatcher={false}
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/error/403');
    });

    it('waits (spinner) and does not redirect while the admin check is unresolved', () => {
      mockPathname.current = '/course-content/course-v1:test+course+2024/agent';
      render(
        <CourseAccessGuard
          course={
            {
              platform_key: 'test-tenant',
              agent_content_mode: true,
              agent_content_mode_audience: ['admins'],
            } as any
          }
          courseInfoLoadingState="successful"
          currentTab="agent"
          isAdmin={false}
          isAdminResolved={false}
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.queryByText('content')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });
});
