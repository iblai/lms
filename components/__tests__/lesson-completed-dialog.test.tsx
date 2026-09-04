import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      mentor: vi.fn(() => 'https://mentor.example.com'),
    },
  },
}));

vi.mock('lodash', () => {
  const isEmpty = (val: any) =>
    val == null ||
    (Array.isArray(val)
      ? val.length === 0
      : typeof val === 'object' && Object.keys(val).length === 0);
  return { default: { isEmpty }, isEmpty };
});

import {
  LESSON_COMPLETED_DIALOG_DELAY_MS,
  LessonCompletedDialog,
} from '../lesson-completed-dialog';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';

const MENTOR_ORIGIN = 'https://mentor.example.com';
const UNIT_1 = 'block-v1:test+101+type@vertical+block@unit-1';
const UNIT_2 = 'block-v1:test+101+type@vertical+block@unit-2';
const UNIT_3 = 'block-v1:test+101+type@vertical+block@unit-3';

const outline = {
  id: 'course-v1:test+101+2024',
  children: [
    {
      id: 'chapter-1',
      children: [
        {
          id: 'sequential-1',
          children: [
            { id: UNIT_1, display_name: 'First Unit' },
            { id: UNIT_2, display_name: 'Second Unit' },
            { id: UNIT_3, display_name: 'Third Unit' },
          ],
        },
      ],
    },
  ],
} as any;

const completedFrame = {
  type: 'lesson.completed',
  course_id: 'course-v1:joetibtest2+C1+2026-08',
  usage_id: 'block-v1:joetibtest2+C1+2026-08+type@html+block@f34715580cdb4ecaa51544c57b3ee264',
  completion: 1,
  display_name: 'Benefits of AI For Education.',
  status_code: 200,
  session_id: '04195f39-8885-4a8a-88d1-495f0bb34225',
};

let selectLesson: ReturnType<typeof vi.fn>;
let refetchCourseOutline: ReturnType<typeof vi.fn>;

const renderDialog = ({
  currentUnitID = UNIT_2,
  courseOutline = outline,
}: { currentUnitID?: string | null; courseOutline?: any } = {}) =>
  render(
    <CourseOutlineContext.Provider
      value={{ selectLesson, currentUnitID, refetchCourseOutline } as any}
    >
      <EdxIframeContext.Provider
        value={{ courseOutline, courseID: 'course-v1:test+101+2024' } as any}
      >
        <LessonCompletedDialog />
      </EdxIframeContext.Provider>
    </CourseOutlineContext.Provider>,
  );

/**
 * jsdom fixes `event.origin` to '' for dispatched MessageEvents, so the origin
 * has to be forced on the instance to exercise the allow-list.
 */
const postFromMentor = async (data: unknown, origin = MENTOR_ORIGIN) => {
  const event = new MessageEvent('message', { data });
  Object.defineProperty(event, 'origin', { value: origin });
  await act(async () => {
    window.dispatchEvent(event);
  });
};

/** Runs out the delay the dialog waits through before it opens. */
const flushOpenDelay = async () => {
  await act(async () => {
    vi.advanceTimersByTime(LESSON_COMPLETED_DIALOG_DELAY_MS);
  });
};

describe('LessonCompletedDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectLesson = vi.fn();
    refetchCourseOutline = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays closed until a lesson.completed frame arrives', () => {
    renderDialog();
    expect(screen.queryByText('Lesson complete')).not.toBeInTheDocument();
  });

  it('opens naming the completed lesson and refetches the outline', async () => {
    renderDialog();
    await postFromMentor(completedFrame);
    await flushOpenDelay();

    expect(screen.getByText('Lesson complete')).toBeInTheDocument();
    expect(
      screen.getByText(/You've completed "Benefits of AI For Education\."/),
    ).toBeInTheDocument();
    expect(refetchCourseOutline).toHaveBeenCalledWith(false);
  });

  it('holds the dialog back for the delay, refreshing the outline straight away', async () => {
    renderDialog();
    await postFromMentor(completedFrame);

    // The sidebar tick updates immediately; only the interruption waits.
    expect(refetchCourseOutline).toHaveBeenCalledWith(false);
    expect(screen.queryByText('Lesson complete')).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(LESSON_COMPLETED_DIALOG_DELAY_MS - 1);
    });
    expect(screen.queryByText('Lesson complete')).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('Lesson complete')).toBeInTheDocument();
  });

  it('ignores frames from another origin', async () => {
    renderDialog();
    await postFromMentor(completedFrame, 'https://evil.example.com');

    expect(screen.queryByText('Lesson complete')).not.toBeInTheDocument();
    expect(refetchCourseOutline).not.toHaveBeenCalled();
  });

  it('ignores a frame that is not a finished lesson', async () => {
    renderDialog();
    await postFromMentor({ ...completedFrame, completion: 0 });

    expect(screen.queryByText('Lesson complete')).not.toBeInTheDocument();
    expect(refetchCourseOutline).not.toHaveBeenCalled();
  });

  it('ignores unrelated messages', async () => {
    renderDialog();
    await postFromMentor({ type: 'MENTOR:CONTEXT_UPDATE' });
    await postFromMentor('a string payload');

    expect(screen.queryByText('Lesson complete')).not.toBeInTheDocument();
  });

  it('offers both directions from a middle unit and navigates forward', async () => {
    renderDialog({ currentUnitID: UNIT_2 });
    await postFromMentor(completedFrame);
    await flushOpenDelay();

    expect(screen.getByText('Lesson complete')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous unit/i })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /next unit/i }));
    });
    expect(selectLesson).toHaveBeenCalledWith(UNIT_3);
  });

  it('navigates backward from a middle unit', async () => {
    renderDialog({ currentUnitID: UNIT_2 });
    await postFromMentor(completedFrame);
    await flushOpenDelay();

    expect(screen.getByText('Lesson complete')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /previous unit/i }));
    });
    expect(selectLesson).toHaveBeenCalledWith(UNIT_1);
  });

  it('hides Previous on the first unit', async () => {
    renderDialog({ currentUnitID: UNIT_1 });
    await postFromMentor(completedFrame);
    await flushOpenDelay();

    expect(screen.getByText('Lesson complete')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /previous unit/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next unit/i })).toBeInTheDocument();
  });

  it('hides Next on the last unit', async () => {
    renderDialog({ currentUnitID: UNIT_3 });
    await postFromMentor(completedFrame);
    await flushOpenDelay();

    expect(screen.getByText('Lesson complete')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next unit/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous unit/i })).toBeInTheDocument();
  });

  it('offers no navigation while the outline is still empty', async () => {
    renderDialog({ courseOutline: {} });
    await postFromMentor(completedFrame);
    await flushOpenDelay();

    expect(screen.getByText('Lesson complete')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next unit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /previous unit/i })).not.toBeInTheDocument();
  });

  it('closes without navigating on "Stay here"', async () => {
    renderDialog();
    await postFromMentor(completedFrame);
    await flushOpenDelay();

    expect(screen.getByText('Lesson complete')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /stay here/i }));
    });

    expect(screen.queryByText('Lesson complete')).not.toBeInTheDocument();
    expect(selectLesson).not.toHaveBeenCalled();
  });

  it('falls back to generic copy when the frame carries no display name', async () => {
    renderDialog();
    await postFromMentor({ ...completedFrame, display_name: undefined });
    await flushOpenDelay();

    expect(screen.getByText(/You've completed this lesson\./)).toBeInTheDocument();
  });
});
