import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import _ from 'lodash';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';

const mockUpdateExamAttempt = vi.fn();
const mockStartExam = vi.fn();
const mockGetExamInfo = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useUpdateExamAttemptMutation: vi.fn(() => [mockUpdateExamAttempt, { isLoading: false }]),
  useStartExamMutation: vi.fn(() => [mockStartExam, { isLoading: false }]),
  useLazyGetExamInfoQuery: vi.fn(() => [mockGetExamInfo]),
}));

vi.mock('lodash', () => ({
  default: {
    isEmpty: vi.fn((val: any) => {
      if (val === null || val === undefined) return true;
      if (typeof val === 'object' && !Array.isArray(val)) return Object.keys(val).length === 0;
      if (Array.isArray(val)) return val.length === 0;
      return false;
    }),
  },
}));

import { TimedExam } from '../timed-exam';

const buildContextValue = (overrides = {}) => ({
  iframeUrl: '',
  setIframeUrl: vi.fn(),
  courseOutline: {} as any,
  setActiveTab: vi.fn(),
  activeTab: '',
  courseID: 'course-v1:test+101',
  currentlyInExamSubsection: false,
  setCurrentlyInExamSubsection: vi.fn(),
  examInfo: null,
  setExamInfo: vi.fn(),
  refresher: null,
  setRefresher: vi.fn(),
  agentMode: 'learning' as const,
  setAgentMode: vi.fn(),
  ...overrides,
});

const noAttemptExamInfo = {
  exam: {
    id: 42,
    exam_name: 'Midterm Exam',
    time_limit_mins: 90,
    course_id: 'course-v1:test+101',
    content_id: 'block-v1:test+101+type@sequential+block@abc',
    attempt: {},
  },
  active_attempt: {},
};

const startedExamInfo = {
  exam: {
    id: 42,
    exam_name: 'Midterm Exam',
    time_limit_mins: 90,
    course_id: 'course-v1:test+101',
    content_id: 'block-v1:test+101+type@sequential+block@abc',
    attempt: {
      attempt_id: 'attempt-1',
      attempt_status: 'started',
      time_remaining_seconds: 5400,
      low_threshold_sec: 3600,
      critically_low_threshold_sec: 1800,
    },
  },
  active_attempt: { attempt_id: 'attempt-1' },
};

const submittedExamInfo = {
  exam: {
    id: 42,
    exam_name: 'Midterm Exam',
    time_limit_mins: 90,
    course_id: 'course-v1:test+101',
    content_id: 'block-v1:test+101+type@sequential+block@abc',
    attempt: {
      attempt_id: 'attempt-1',
      attempt_status: 'submitted',
    },
  },
  active_attempt: null,
};

const renderTimedExam = (contextOverrides = {}) => {
  const contextValue = buildContextValue(contextOverrides);
  return render(
    <EdxIframeContext.Provider value={contextValue}>
      <TimedExam />
    </EdxIframeContext.Provider>,
  );
};

describe('TimedExam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Re-apply lodash mock implementation
    vi.mocked(_.isEmpty).mockImplementation((val: any) => {
      if (val === null || val === undefined) return true;
      if (typeof val === 'object' && !Array.isArray(val)) return Object.keys(val).length === 0;
      if (Array.isArray(val)) return val.length === 0;
      return false;
    });
    mockUpdateExamAttempt.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });
    mockStartExam.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });
    mockGetExamInfo.mockResolvedValue({ data: startedExamInfo });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when examInfo is null', () => {
    const { container } = renderTimedExam({ examInfo: null });
    expect(container.firstChild).toBeNull();
  });

  it('returns null when exam is submitted', () => {
    const { container } = renderTimedExam({ examInfo: submittedExamInfo });
    expect(container.firstChild).toBeNull();
  });

  it('renders ready-to-start UI when no attempt exists', () => {
    renderTimedExam({ examInfo: noAttemptExamInfo });
    expect(screen.getByText(/Midterm Exam is a Timed Exam/)).toBeInTheDocument();
  });

  it('renders time limit in hours and minutes format (mixed)', () => {
    const examWith90Mins = {
      ...noAttemptExamInfo,
      exam: { ...noAttemptExamInfo.exam, time_limit_mins: 90 },
    };
    renderTimedExam({ examInfo: examWith90Mins });
    // Use getAllByText since the time appears in multiple elements
    const elements = screen.getAllByText(/1 hour 30 minutes/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders time limit in hours only (plural)', () => {
    const examWith120Mins = {
      ...noAttemptExamInfo,
      exam: { ...noAttemptExamInfo.exam, time_limit_mins: 120 },
    };
    renderTimedExam({ examInfo: examWith120Mins });
    const elements = screen.getAllByText(/2 hours/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders time limit in hours only (singular)', () => {
    const examWith60Mins = {
      ...noAttemptExamInfo,
      exam: { ...noAttemptExamInfo.exam, time_limit_mins: 60 },
    };
    renderTimedExam({ examInfo: examWith60Mins });
    const elements = screen.getAllByText(/1 hour/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders time limit in minutes only (plural)', () => {
    const examWith30Mins = {
      ...noAttemptExamInfo,
      exam: { ...noAttemptExamInfo.exam, time_limit_mins: 30 },
    };
    renderTimedExam({ examInfo: examWith30Mins });
    const elements = screen.getAllByText(/30 minutes/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders time limit in minutes only (singular)', () => {
    const examWith1Min = {
      ...noAttemptExamInfo,
      exam: { ...noAttemptExamInfo.exam, time_limit_mins: 1 },
    };
    renderTimedExam({ examInfo: examWith1Min });
    const elements = screen.getAllByText(/1 minute/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders start exam button', () => {
    renderTimedExam({ examInfo: noAttemptExamInfo });
    // The text appears in button and in sr-only div, use getAllByText
    const elements = screen.getAllByText(/I am ready to start this timed exam/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders additional time allowance section', () => {
    renderTimedExam({ examInfo: noAttemptExamInfo });
    expect(screen.getByText(/Can I request additional time/)).toBeInTheDocument();
  });

  it('calls handleStartExam when start button clicked', async () => {
    mockStartExam.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
    mockGetExamInfo.mockResolvedValue({ data: startedExamInfo });
    renderTimedExam({ examInfo: noAttemptExamInfo });

    // Get the actual button (not sr-only text)
    const startBtn = screen.getByRole('button', { name: /I am ready to start this timed exam/ });
    await act(async () => {
      fireEvent.click(startBtn);
    });
    expect(mockStartExam).toHaveBeenCalled();
  });

  it('handles start exam error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockStartExam.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('Start failed')),
    });
    renderTimedExam({ examInfo: noAttemptExamInfo });

    const startBtn = screen.getByRole('button', { name: /I am ready to start this timed exam/ });
    await act(async () => {
      fireEvent.click(startBtn);
    });
    expect(consoleSpy).toHaveBeenCalledWith('Failed to start exam:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('renders timer UI when exam is started', () => {
    renderTimedExam({ examInfo: startedExamInfo });
    expect(screen.getByText(/You are taking "Midterm Exam" as a timed exam/)).toBeInTheDocument();
  });

  it('shows time remaining in hours:mm:ss format', () => {
    renderTimedExam({ examInfo: startedExamInfo });
    // 5400 seconds = 1:30:00
    expect(screen.getByText('1:30:00')).toBeInTheDocument();
  });

  it('shows time remaining in mm:ss format for sub-hour', () => {
    const examWithShortTime = {
      ...startedExamInfo,
      exam: {
        ...startedExamInfo.exam,
        attempt: {
          ...startedExamInfo.exam.attempt,
          time_remaining_seconds: 305,
        },
      },
    };
    renderTimedExam({ examInfo: examWithShortTime });
    // 305 seconds = 5:05
    expect(screen.getByText('5:05')).toBeInTheDocument();
  });

  it('shows End My Exam button when exam is started', () => {
    renderTimedExam({ examInfo: startedExamInfo });
    expect(screen.getByText('End My Exam')).toBeInTheDocument();
  });

  it('shows Show more link', () => {
    renderTimedExam({ examInfo: startedExamInfo });
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  it('toggles to full instructions when Show more is clicked', () => {
    renderTimedExam({ examInfo: startedExamInfo });
    fireEvent.click(screen.getByText('Show more'));
    expect(screen.getByText('Show less')).toBeInTheDocument();
    expect(screen.getByText(/To receive credit for problems/)).toBeInTheDocument();
  });

  it('toggles back to short instructions when Show less is clicked', () => {
    renderTimedExam({ examInfo: startedExamInfo });
    fireEvent.click(screen.getByText('Show more'));
    fireEvent.click(screen.getByText('Show less'));
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  it('opens end exam confirmation modal when End My Exam is clicked', () => {
    renderTimedExam({ examInfo: startedExamInfo });
    fireEvent.click(screen.getByText('End My Exam'));
    expect(
      screen.getByText(/Are you sure that you want to submit your timed exam/),
    ).toBeInTheDocument();
  });

  it('closes end exam modal when Cancel is clicked', () => {
    renderTimedExam({ examInfo: startedExamInfo });
    fireEvent.click(screen.getByText('End My Exam'));
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/No, I want to continue working/));
    expect(screen.queryByText(/Are you sure/)).not.toBeInTheDocument();
  });

  it('submits exam when confirm end exam is clicked', async () => {
    mockUpdateExamAttempt.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
    mockGetExamInfo.mockResolvedValue({ data: submittedExamInfo });

    renderTimedExam({ examInfo: startedExamInfo });
    fireEvent.click(screen.getByText('End My Exam'));

    await act(async () => {
      fireEvent.click(screen.getByText(/Yes, submit my timed exam/));
    });
    expect(mockUpdateExamAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'submit' }),
    );
  });

  it('handles submit exam error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUpdateExamAttempt.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('Submit failed')),
    });

    renderTimedExam({ examInfo: startedExamInfo });
    fireEvent.click(screen.getByText('End My Exam'));

    await act(async () => {
      fireEvent.click(screen.getByText(/Yes, submit my timed exam/));
    });
    expect(consoleSpy).toHaveBeenCalledWith('Failed to submit exam:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('shows normal time style (blue) when time is high', () => {
    const examWithHighTime = {
      ...startedExamInfo,
      exam: {
        ...startedExamInfo.exam,
        attempt: {
          ...startedExamInfo.exam.attempt,
          time_remaining_seconds: 10000,
          low_threshold_sec: 3600,
          critically_low_threshold_sec: 1800,
        },
      },
    };
    const { container } = renderTimedExam({ examInfo: examWithHighTime });
    expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
  });

  it('shows the low-time (light blue) style when time is low', () => {
    const examWithLowTime = {
      ...startedExamInfo,
      exam: {
        ...startedExamInfo.exam,
        attempt: {
          ...startedExamInfo.exam.attempt,
          time_remaining_seconds: 2000,
          low_threshold_sec: 3600,
          critically_low_threshold_sec: 1800,
        },
      },
    };
    const { container } = renderTimedExam({ examInfo: examWithLowTime });
    expect(container.querySelector('[class*="bg-[#dbeafe]"]')).toBeInTheDocument();
  });

  it('shows red style when time is critically low', () => {
    const examWithCriticalTime = {
      ...startedExamInfo,
      exam: {
        ...startedExamInfo.exam,
        attempt: {
          ...startedExamInfo.exam.attempt,
          time_remaining_seconds: 500,
          low_threshold_sec: 3600,
          critically_low_threshold_sec: 1800,
        },
      },
    };
    const { container } = renderTimedExam({ examInfo: examWithCriticalTime });
    expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
  });

  it('countdown timer decrements time', async () => {
    renderTimedExam({ examInfo: startedExamInfo });
    expect(screen.getByText('1:30:00')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('1:29:59')).toBeInTheDocument();
  });

  it('initializes timer from examInfo when started', () => {
    const examWithSpecificTime = {
      ...startedExamInfo,
      exam: {
        ...startedExamInfo.exam,
        attempt: {
          ...startedExamInfo.exam.attempt,
          time_remaining_seconds: 3723,
        },
      },
    };
    renderTimedExam({ examInfo: examWithSpecificTime });
    // 3723 seconds = 1:02:03
    expect(screen.getByText('1:02:03')).toBeInTheDocument();
  });

  it('auto-submits when timer reaches zero', async () => {
    const examWithShortTime = {
      ...startedExamInfo,
      exam: {
        ...startedExamInfo.exam,
        attempt: {
          ...startedExamInfo.exam.attempt,
          time_remaining_seconds: 1,
        },
      },
    };
    const mockUnwrap = vi.fn().mockResolvedValue({});
    mockUpdateExamAttempt.mockReturnValue({ unwrap: mockUnwrap });

    renderTimedExam({ examInfo: examWithShortTime });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    // Flush all pending promises
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockUpdateExamAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'submit' }),
    );
  });

  it('handles auto-submit error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const examWithShortTime = {
      ...startedExamInfo,
      exam: {
        ...startedExamInfo.exam,
        attempt: {
          ...startedExamInfo.exam.attempt,
          time_remaining_seconds: 1,
        },
      },
    };
    const mockUnwrap = vi.fn().mockRejectedValue(new Error('Auto-submit failed'));
    mockUpdateExamAttempt.mockReturnValue({ unwrap: mockUnwrap });

    renderTimedExam({ examInfo: examWithShortTime });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to auto-submit exam:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('does not run countdown when exam is not started', async () => {
    renderTimedExam({ examInfo: noAttemptExamInfo });

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Timer should not have been running - no timer display shown
    expect(screen.queryByText(/End My Exam/)).not.toBeInTheDocument();
  });

  it('handles updateExamInfo call in updateExamInfo method', async () => {
    mockGetExamInfo.mockResolvedValue({ data: submittedExamInfo });
    mockUpdateExamAttempt.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });

    renderTimedExam({ examInfo: startedExamInfo });
    fireEvent.click(screen.getByText('End My Exam'));

    await act(async () => {
      fireEvent.click(screen.getByText(/Yes, submit my timed exam/));
      await Promise.resolve();
    });

    expect(mockGetExamInfo).toHaveBeenCalled();
  });

  it('handles updateExamInfo with null data', async () => {
    mockGetExamInfo.mockResolvedValue({ data: null });
    mockUpdateExamAttempt.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
    const mockSetExamInfo = vi.fn();

    renderTimedExam({ examInfo: startedExamInfo, setExamInfo: mockSetExamInfo });
    fireEvent.click(screen.getByText('End My Exam'));

    await act(async () => {
      fireEvent.click(screen.getByText(/Yes, submit my timed exam/));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockSetExamInfo).toHaveBeenCalledWith(null);
  });

  it('disables start button when starting exam', async () => {
    mockStartExam.mockReturnValue({
      unwrap: vi.fn().mockImplementation(() => new Promise<void>(() => {})),
    });

    renderTimedExam({ examInfo: noAttemptExamInfo });
    const startBtn = screen.getByRole('button', { name: /I am ready to start this timed exam/ });

    act(() => {
      fireEvent.click(startBtn);
    });

    // After click, button should be disabled due to isReadyToStart state
    expect(startBtn).toBeDisabled();
  });

  it('renders with default threshold values when not provided', () => {
    const examWithNoThresholds = {
      ...startedExamInfo,
      exam: {
        ...startedExamInfo.exam,
        attempt: {
          ...startedExamInfo.exam.attempt,
          time_remaining_seconds: 100,
          low_threshold_sec: undefined,
          critically_low_threshold_sec: undefined,
        },
      },
    };
    const { container } = renderTimedExam({ examInfo: examWithNoThresholds });
    // With default thresholds, 100 seconds should be critically low (< 3600)
    expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
  });

  it('shows hour:min:sec format correctly for zero seconds', () => {
    const examWithZeroTime = {
      ...startedExamInfo,
      exam: {
        ...startedExamInfo.exam,
        attempt: {
          ...startedExamInfo.exam.attempt,
          time_remaining_seconds: 3600,
        },
      },
    };
    renderTimedExam({ examInfo: examWithZeroTime });
    // 3600 seconds = 1:00:00
    expect(screen.getByText('1:00:00')).toBeInTheDocument();
  });

  it('handles exam with no active_attempt', () => {
    // When both attempt and active_attempt are empty, should show ready-to-start UI
    vi.mocked(_.isEmpty).mockReturnValue(true);
    const examWithNoActive = {
      ...noAttemptExamInfo,
      active_attempt: null,
    };
    renderTimedExam({ examInfo: examWithNoActive });
    expect(screen.getByText(/Midterm Exam is a Timed Exam/)).toBeInTheDocument();
  });

  it('shows "Starting exam..." text when isStartingExam is true', async () => {
    // @ts-ignore
    const { useStartExamMutation } = await import('@iblai/iblai-js/data-layer');
    vi.mocked(useStartExamMutation as any).mockReturnValue([mockStartExam, { isLoading: true }]);
    renderTimedExam({ examInfo: noAttemptExamInfo });
    const elements = screen.getAllByText(/Starting exam.../);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('shows "Submitting..." text when isSubmittingExam is true', async () => {
    // @ts-ignore
    const { useUpdateExamAttemptMutation } = await import('@iblai/iblai-js/data-layer');
    vi.mocked(useUpdateExamAttemptMutation as any).mockReturnValue([
      mockUpdateExamAttempt,
      { isLoading: true },
    ]);
    renderTimedExam({ examInfo: startedExamInfo });
    fireEvent.click(screen.getByText('End My Exam'));
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });
});
