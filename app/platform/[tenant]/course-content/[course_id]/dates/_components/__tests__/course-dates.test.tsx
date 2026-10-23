import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import type { CourseDateBlock, CourseDatesResponse } from '@/types/course-home';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const hooks = vi.hoisted(() => ({ dates: vi.fn(), meta: vi.fn(), reset: vi.fn() }));
vi.mock('@/services/course-home', () => ({
  useGetCourseDatesQuery: (...args: any[]) => hooks.dates(...args),
  useGetCourseHomeMetaQuery: (...args: any[]) => hooks.meta(...args),
  useResetCourseDeadlinesMutation: () => [hooks.reset, { isLoading: false }],
}));

import { toast } from 'sonner';
import { assignmentHref, CourseDates } from '../course-dates';

const NOW = new Date('2026-06-10T12:00:00Z');
const block = (overrides: Partial<CourseDateBlock>): CourseDateBlock => ({
  assignment_type: 'Homework',
  complete: false,
  date: '2026-06-12T23:59:00Z',
  date_type: 'assignment-due-date',
  description: '',
  learner_has_access: true,
  link: 'https://apps.lms/learning/course/c/block-v1:o+c+r+type@sequential+block@seq-1/',
  link_text: '',
  title: 'HW 1',
  extra_info: null,
  ...overrides,
});
const response = (
  blocks: CourseDateBlock[],
  extra: Partial<CourseDatesResponse> = {},
): CourseDatesResponse => ({
  course_date_blocks: blocks,
  dates_banner_info: {
    missed_deadlines: false,
    content_type_gating_enabled: false,
    missed_gated_content: false,
    verified_upgrade_link: null,
  },
  has_ended: false,
  learner_is_full_access: true,
  user_timezone: 'UTC',
  ...extra,
});

const outline = {
  id: 'course',
  block_id: 'course',
  type: 'course',
  display_name: 'Course',
  children: [
    {
      id: 'block-v1:o+c+r+type@sequential+block@seq-1',
      block_id: 'seq-1',
      type: 'sequential',
      display_name: 'Seq',
      children: [
        {
          id: 'block-v1:o+c+r+type@vertical+block@unit-1',
          block_id: 'unit-1',
          type: 'vertical',
          display_name: 'U1',
          children: [],
        },
      ],
    },
  ],
};

const renderPage = () =>
  render(
    <CourseOutlineContext.Provider value={{ courseOutline: outline } as any}>
      <CourseDates courseId="course-v1:o+c+r" courseBasePath="/c" now={NOW} />
    </CourseOutlineContext.Provider>,
  );

describe('CourseDates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.meta.mockReturnValue({ data: { is_self_paced: true, user_timezone: null } });
  });

  it('shows the loading, error and empty states', () => {
    hooks.dates.mockReturnValue({ data: undefined, isLoading: true });
    const { unmount } = renderPage();
    expect(screen.getByTestId('course-dates-loading')).toBeInTheDocument();
    unmount();
    hooks.dates.mockReturnValue({ data: undefined, isLoading: false, error: new Error('boom') });
    const second = renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the course dates. boom");
    second.unmount();
    hooks.dates.mockReturnValue({ data: response([]), isLoading: false });
    renderPage();
    expect(screen.getByTestId('dates-empty')).toBeInTheDocument();
    expect(screen.getByText(/shown in UTC/)).toBeInTheDocument();
  });

  it('renders the timeline with badges, in-app links, due times and extra info', () => {
    hooks.dates.mockReturnValue({
      data: response([
        block({
          title: 'Course starts',
          date_type: 'course-start-date',
          assignment_type: null,
          complete: null,
          link: '',
          date: '2026-06-01T00:00:00Z',
        }),
        block({
          title: 'Old HW',
          date: '2026-06-05T00:00:00Z',
          description: 'Late work',
          extra_info: 'Counts double',
        }),
        block({ title: 'HW 1' }),
        block({
          title: 'Mystery',
          date: '2026-06-20T00:00:00Z',
          link: 'https://lms/courses/x/jump_to/block-v1:unknown',
          first_component_block_id: '',
        }),
        block({ title: 'Gated', date: '2026-06-25T00:00:00Z', learner_has_access: false }),
      ]),
      isLoading: false,
    });
    renderPage();
    expect(hooks.dates).toHaveBeenCalledWith({ courseId: 'course-v1:o+c+r' });
    const days = screen.getAllByTestId('dates-day');
    expect(days).toHaveLength(6);
    expect(within(days[0]).getByTestId('dates-day-header')).toHaveTextContent('Mon, Jun 1, 2026');
    expect(within(days[0]).getByTestId('dates-item')).toHaveTextContent('Course starts');
    expect(within(days[0]).queryByRole('link')).not.toBeInTheDocument();

    expect(within(days[1]).getByTestId('dates-day-header')).toHaveTextContent('Past due');
    expect(within(days[1]).getByText('Late work')).toBeInTheDocument();
    expect(within(days[1]).getByTestId('dates-extra-info')).toHaveAttribute(
      'aria-label',
      'Counts double',
    );

    expect(within(days[2]).getByTestId('dates-day-header')).toHaveTextContent('Today');
    expect(within(days[2]).queryByTestId('dates-item')).not.toBeInTheDocument();

    expect(within(days[3]).getByTestId('dates-day-header')).toHaveTextContent('Due next');
    expect(within(days[3]).getByRole('link', { name: 'HW 1' })).toHaveAttribute(
      'href',
      '/c/course?unit_id=block-v1%3Ao%2Bc%2Br%2Btype%40vertical%2Bblock%40unit-1',
    );
    expect(within(days[3]).getByTestId('dates-item')).toHaveTextContent(
      'Homework: HW 1 due 11:59 PM',
    );

    const external = within(days[4]).getByRole('link', { name: /Mystery/ });
    expect(external).toHaveAttribute('href', 'https://lms/courses/x/jump_to/block-v1:unknown');
    expect(external).toHaveAttribute('target', '_blank');

    expect(within(days[5]).getByTestId('dates-day-header')).toHaveTextContent('Verified only');
    expect(within(days[5]).queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByTestId('shift-dates-alert')).not.toBeInTheDocument();
  });

  it('offers to shift due dates on a self-paced course with missed deadlines', async () => {
    const data = response([block({ date: '2026-06-05T00:00:00Z' })], {
      dates_banner_info: {
        missed_deadlines: true,
        content_type_gating_enabled: false,
        missed_gated_content: false,
        verified_upgrade_link: null,
      },
      user_timezone: null,
    });
    hooks.dates.mockReturnValue({ data, isLoading: false });
    hooks.reset
      .mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('nope')) })
      .mockReturnValueOnce({ unwrap: () => Promise.resolve({ message: 'Deadlines updated' }) })
      .mockReturnValueOnce({ unwrap: () => Promise.resolve({}) });
    renderPage();
    expect(screen.getByTestId('shift-dates-alert')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Shift due dates' });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(hooks.reset).toHaveBeenCalledWith({ courseId: 'course-v1:o+c+r' });
    expect(toast.error).toHaveBeenCalledWith('nope');
    await act(async () => {
      fireEvent.click(button);
    });
    expect(toast.success).toHaveBeenCalledWith('Deadlines updated');
    await act(async () => {
      fireEvent.click(button);
    });
    expect(toast.success).toHaveBeenCalledWith('Your due dates have been shifted.');
  });

  it('hides the shift alert for instructor-paced or ended courses and shows the upgrade note', () => {
    const banner = {
      missed_deadlines: true,
      content_type_gating_enabled: true,
      missed_gated_content: true,
      verified_upgrade_link: 'https://upgrade',
    };
    hooks.dates.mockReturnValue({
      data: response([block({})], { dates_banner_info: banner }),
      isLoading: false,
    });
    hooks.meta.mockReturnValue({ data: { is_self_paced: false } });
    const { unmount } = renderPage();
    expect(screen.queryByTestId('shift-dates-alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-to-shift-alert')).not.toBeInTheDocument();
    unmount();

    hooks.meta.mockReturnValue({ data: { is_self_paced: true } });
    hooks.dates.mockReturnValue({
      data: response([block({})], { dates_banner_info: banner, has_ended: true }),
      isLoading: false,
    });
    const ended = renderPage();
    expect(screen.queryByTestId('shift-dates-alert')).not.toBeInTheDocument();
    ended.unmount();

    hooks.dates.mockReturnValue({
      data: response([block({})], { dates_banner_info: banner }),
      isLoading: false,
    });
    renderPage();
    expect(screen.getByTestId('shift-dates-alert')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'upgrade your enrollment' })).toHaveAttribute(
      'href',
      'https://upgrade',
    );
  });
});

describe('assignmentHref', () => {
  it('prefers the first component block, then the link, then the LMS URL', () => {
    const item = block({ first_component_block_id: 'block-v1:o+c+r+type@vertical+block@unit-1' });
    expect(assignmentHref(item, outline as any, '/c')).toEqual({
      href: '/c/course?unit_id=block-v1%3Ao%2Bc%2Br%2Btype%40vertical%2Bblock%40unit-1',
      external: false,
    });
    expect(assignmentHref(block({ link: 'https://lms/other' }), outline as any, '/c')).toEqual({
      href: 'https://lms/other',
      external: true,
    });
    expect(assignmentHref(block({ link: '' }), outline as any, '/c')).toBeNull();
    expect(
      assignmentHref(block({ date_type: 'course-end-date' }), outline as any, '/c'),
    ).toBeNull();
  });
});
