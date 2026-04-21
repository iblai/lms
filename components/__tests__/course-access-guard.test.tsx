import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

import { CourseAccessGuard } from '../course-access-guard';
import { getTenant } from '@/utils/helpers';

describe('CourseAccessGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTenant).mockReturnValue('test-tenant');
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

  describe('unauthorized tenant', () => {
    it('redirects to /error/403 when platform_key differs from tenant', () => {
      render(
        <CourseAccessGuard
          course={{ platform_key: 'other-tenant' } as any}
          courseInfoLoadingState="successful"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).toHaveBeenCalledWith('/error/403');
    });

    it('shows spinner instead of children when tenant is unauthorized', () => {
      render(
        <CourseAccessGuard
          course={{ platform_key: 'other-tenant' } as any}
          courseInfoLoadingState="successful"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(screen.queryByText('content')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('course not found', () => {
    it('redirects to /error/404 when course is null after failure', () => {
      render(
        <CourseAccessGuard course={null} courseInfoLoadingState="failure">
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).toHaveBeenCalledWith('/error/404');
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
    it('redirects to /error/403 on agent tab when agent_content_mode is false', () => {
      render(
        <CourseAccessGuard
          course={{ platform_key: 'test-tenant', agent_content_mode: false } as any}
          courseInfoLoadingState="successful"
          currentTab="agent"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).toHaveBeenCalledWith('/error/403');
      expect(screen.queryByText('content')).not.toBeInTheDocument();
    });

    it('does not redirect on agent tab when agent_content_mode is true', () => {
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
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('does not redirect on agent tab when agent_content_mode is null', () => {
      render(
        <CourseAccessGuard
          course={{ platform_key: 'test-tenant', agent_content_mode: null } as any}
          courseInfoLoadingState="successful"
          currentTab="agent"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('redirects to /error/403 on course tab when course_content_mode is not true', () => {
      render(
        <CourseAccessGuard
          course={{ platform_key: 'test-tenant', course_content_mode: false } as any}
          courseInfoLoadingState="successful"
          currentTab="course"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).toHaveBeenCalledWith('/error/403');
    });

    it('redirects to /error/403 on course tab when course_content_mode is null', () => {
      render(
        <CourseAccessGuard
          course={{ platform_key: 'test-tenant', course_content_mode: null } as any}
          courseInfoLoadingState="successful"
          currentTab="course"
        >
          <div>content</div>
        </CourseAccessGuard>,
      );
      expect(mockPush).toHaveBeenCalledWith('/error/403');
    });

    it('does not redirect on course tab when course_content_mode is true', () => {
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
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('does not redirect on other tabs regardless of content mode flags', () => {
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
      expect(screen.getByText('content')).toBeInTheDocument();
    });
  });
});
