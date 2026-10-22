import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import type { CourseProgress as CourseProgressData } from '@/types/courses';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const hooks = vi.hoisted(() => ({ progress: vi.fn(), meta: vi.fn(), legacyPost: vi.fn() }));
vi.mock('@/services/course-metadata', () => ({
  useGetCourseProgressQuery: (...args: any[]) => hooks.progress(...args),
}));
vi.mock('@/services/course-home', () => ({
  useGetCourseHomeMetaQuery: (...args: any[]) => hooks.meta(...args),
}));
vi.mock('@/services/instructor', () => ({
  legacyLmsPost: (...args: any[]) => hooks.legacyPost(...args),
}));
// The grade tables have their own tests.
vi.mock('../progress-grades', () => ({
  GradeBar: () => <div data-testid="grade-bar" />,
  GradeSummaryTable: (props: any) => (
    <div data-testid="grade-summary">{props.summaries.length}</div>
  ),
  DetailedGrades: (props: any) => (
    <div data-testid="detailed-grades">{String(props.fullyLocked)}</div>
  ),
}));

import { toast } from 'sonner';
import { CompletionDonut, CourseProgress } from '../course-progress';

const base: CourseProgressData = {
  can_show_upgrade_sock: false,
  verified_mode: null,
  access_expiration: null,
  certificate_data: null,
  completion_summary: { complete_count: 2, incomplete_count: 6, locked_count: 0 },
  course_grade: { letter_grade: null, percent: 0.3, is_passing: false },
  credit_course_requirements: null,
  end: null,
  enrollment_mode: 'honor',
  grading_policy: {
    assignment_policies: [
      { num_droppable: 0, num_total: 1, short_label: 'HW', type: 'Homework', weight: 1 },
    ],
    grade_range: { Pass: 0.5 },
  },
  has_scheduled_content: false,
  section_scores: [],
  studio_url: 'https://studio/course',
  username: 'ada',
  user_has_passing_grade: false,
  verification_data: { link: null, status: 'none', status_date: null },
};

const renderPage = () =>
  render(<CourseProgress courseId="course-v1:o+c+r" courseBasePath="/p/acme/course-content/x" />);

describe('CourseProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.progress.mockReturnValue({ data: base, isLoading: false });
    hooks.meta.mockReturnValue({ data: { is_staff: false } });
  });

  it('shows the loading skeleton and the error state', () => {
    hooks.progress.mockReturnValue({ data: undefined, isLoading: true });
    const { unmount } = renderPage();
    expect(screen.getByTestId('course-progress-loading')).toBeInTheDocument();
    unmount();
    hooks.progress.mockReturnValue({ data: undefined, isLoading: false, error: new Error('boom') });
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load your progress. boom");
  });

  it('renders completion, grades, detailed grades and related links', () => {
    renderPage();
    expect(hooks.progress).toHaveBeenCalledWith({ courseKey: 'course-v1:o+c+r' });
    expect(screen.getByRole('heading', { name: 'Your progress' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Course completion' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '25% complete, 75% incomplete' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Grades' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Grade summary' })).toBeInTheDocument();
    expect(screen.getByTestId('grade-summary')).toHaveTextContent('1');
    expect(screen.getByTestId('detailed-grades')).toHaveTextContent('false');
    expect(screen.queryByTestId('grades-locked')).not.toBeInTheDocument();
    expect(screen.queryByTestId('certificate-status')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Dates/ })).toHaveAttribute(
      'href',
      '/p/acme/course-content/x/dates',
    );
    expect(screen.getByRole('link', { name: /Discussions/ })).toHaveAttribute(
      'href',
      '/p/acme/course-content/x/discussion',
    );
  });

  it('explains courses without a grading policy', () => {
    hooks.progress.mockReturnValue({
      data: { ...base, grading_policy: { assignment_policies: [], grade_range: {} } },
      isLoading: false,
    });
    renderPage();
    expect(screen.queryByRole('link', { name: /Studio/ })).not.toBeInTheDocument();
    expect(screen.getByText('This course has no graded assignments.')).toBeInTheDocument();
    expect(screen.queryByTestId('grade-summary')).not.toBeInTheDocument();
  });

  it('greys out the grades when they are fully locked', () => {
    hooks.progress.mockReturnValue({
      data: {
        ...base,
        completion_summary: { complete_count: 0, incomplete_count: 1, locked_count: 3 },
      },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByTestId('grades-locked')).toBeInTheDocument();
    expect(screen.getByTestId('detailed-grades')).toHaveTextContent('true');
    expect(
      screen.getByRole('img', { name: '0% complete, 25% incomplete, 75% locked' }),
    ).toBeInTheDocument();
  });

  it('shows a viewable certificate', () => {
    hooks.progress.mockReturnValue({
      data: {
        ...base,
        user_has_passing_grade: true,
        certificate_data: {
          cert_status: 'downloadable',
          cert_web_view_url: 'https://lms/cert/1',
          download_url: null,
          certificate_available_date: null,
        },
      },
      isLoading: false,
    });
    renderPage();
    const card = screen.getByTestId('certificate-status');
    expect(card).toHaveTextContent('Your certificate is available');
    expect(screen.getByRole('link', { name: /View certificate/ })).toHaveAttribute(
      'href',
      'https://lms/cert/1',
    );
  });

  it('requests a certificate through the legacy LMS view', async () => {
    hooks.progress.mockReturnValue({
      data: {
        ...base,
        user_has_passing_grade: true,
        certificate_data: {
          cert_status: 'requesting',
          cert_web_view_url: null,
          download_url: null,
          certificate_available_date: null,
        },
      },
      isLoading: false,
    });
    hooks.legacyPost.mockRejectedValueOnce(new Error('nope')).mockResolvedValueOnce({});
    renderPage();
    const button = screen.getByRole('button', { name: 'Request certificate' });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(hooks.legacyPost).toHaveBeenCalledWith(
      '/courses/course-v1:o+c+r/generate_user_cert',
      {},
    );
    expect(toast.error).toHaveBeenCalledWith('nope');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Request certificate' }));
    });
    expect(toast.success).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Request certificate' })).not.toBeInTheDocument();
  });

  it('falls back to a generic error toast when the request fails without a message', async () => {
    hooks.progress.mockReturnValue({
      data: {
        ...base,
        user_has_passing_grade: true,
        certificate_data: {
          cert_status: 'requesting',
          cert_web_view_url: null,
          download_url: null,
          certificate_available_date: null,
        },
      },
      isLoading: false,
    });
    hooks.legacyPost.mockRejectedValueOnce({});
    renderPage();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Request certificate' }));
    });
    expect(toast.error).toHaveBeenCalledWith('The certificate could not be requested');
  });
});

describe('CompletionDonut', () => {
  it('draws the locked segment only when something is locked', () => {
    const { container, rerender } = render(
      <CompletionDonut summary={{ complete_count: 1, incomplete_count: 1, locked_count: 0 }} />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(screen.getByText('50%', { selector: 'text' })).toBeInTheDocument();
    rerender(
      <CompletionDonut summary={{ complete_count: 4, incomplete_count: 0, locked_count: 0 }} />,
    );
    expect(container.querySelector('circle.stroke-amber-500')).not.toHaveAttribute(
      'stroke-linecap',
    );
    rerender(
      <CompletionDonut summary={{ complete_count: 1, incomplete_count: 1, locked_count: 2 }} />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(3);
    expect(screen.getByText('locked', { exact: false })).toBeInTheDocument();
  });
});
