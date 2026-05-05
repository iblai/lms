import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act, fireEvent } from '@testing-library/react';
import { EdxIframe } from '../edx-iframe';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { LOCALSTORAGE_KEYS } from '@/constants/storage';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const { mockGetIframeURL, mockFindSequentialParent } = vi.hoisted(() => ({
  mockGetIframeURL: vi.fn(
    (_courseId: string, _courseInfo: unknown, callback: (url: string) => void) => {
      callback('https://apps.learn.example.com/discussions/course-v1:test+course/posts');
    },
  ),
  mockFindSequentialParent: vi.fn(() => null),
}));

vi.mock('@/hooks/courses/use-edx-iframe', () => ({
  useEdxIframe: () => ({
    getIframeURL: mockGetIframeURL,
    findSequentialParent: mockFindSequentialParent,
  }),
}));

vi.mock('@/hooks/courses/useCourseNavigator', () => ({
  default: () => ({
    navigator: {
      moveToPrevious: vi.fn(() => null),
      moveToNext: vi.fn(() => null),
      isPreviousHidden: vi.fn(() => true),
      isNextHidden: vi.fn(() => true),
      thirdLevelChildren: [],
      currentIndex: 0,
    },
  }),
}));

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetExamInfoQuery: () => [vi.fn()],
}));

vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: any) => fn,
}));

vi.mock('../timed-exam', () => ({
  TimedExam: () => <div data-testid="timed-exam">Timed Exam</div>,
}));

describe('EdxIframe - JWT PostMessage', () => {
  const mockSetIframeUrl = vi.fn();
  const mockSetActiveTab = vi.fn();
  const mockSetCurrentlyInExamSubsection = vi.fn();
  const mockSetExamInfo = vi.fn();
  const mockSelectLesson = vi.fn();
  const mockRefetchCourseOutline = vi.fn();

  const defaultContextValue = {
    iframeUrl: 'https://apps.learn.example.com/discussions/course-v1:test+course/posts',
    setIframeUrl: mockSetIframeUrl,
    courseOutline: {
      id: 'root',
      block_id: 'root-block',
      type: 'course',
      display_name: 'Test Course',
      children: [
        {
          id: 'test',
          block_id: 'test-block',
          type: 'chapter',
          display_name: 'Test Chapter',
          children: [],
        },
      ],
    }, // Non-empty to trigger course load
    setActiveTab: mockSetActiveTab,
    activeTab: 'forum',
    courseID: 'course-v1:test+course',
    currentlyInExamSubsection: false,
    setCurrentlyInExamSubsection: mockSetCurrentlyInExamSubsection,
    examInfo: null,
    setExamInfo: mockSetExamInfo,
    refresher: null,
    setRefresher: vi.fn(),
    agentMode: 'learning' as const,
    setAgentMode: vi.fn(),
  };

  const defaultCourseOutlineValue = {
    courseOutline: {} as any,
    courseOutlineLoading: false,
    expandedModule: '',
    expandedLessons: [],
    selectLesson: mockSelectLesson,
    toggleModule: vi.fn(),
    toggleLesson: vi.fn(),
    currentChapter: '',
    currentLesson: '',
    course: null,
    courseOutlineDrawerOpen: false,
    setCourseOutlineDrawerOpen: vi.fn(),
    currentUnitID: null,
    refetchCourseOutline: mockRefetchCourseOutline,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderEdxIframe = (
    contextValue = defaultContextValue,
    courseOutlineValue = defaultCourseOutlineValue,
  ) => {
    return render(
      <EdxIframeContext.Provider value={contextValue}>
        <CourseOutlineContext.Provider value={courseOutlineValue}>
          <EdxIframe />
        </CourseOutlineContext.Provider>
      </EdxIframeContext.Provider>,
    );
  };

  it('renders loading state initially', () => {
    const { container } = renderEdxIframe();

    // Component should render something (either loading or iframe)
    expect(container.firstChild).toBeTruthy();
  });

  it('renders iframe after loading completes', async () => {
    const { container } = renderEdxIframe();

    await waitFor(
      () => {
        const iframe = container.querySelector('iframe');
        expect(iframe).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('sets iframe src from context', async () => {
    const { container } = renderEdxIframe();

    await waitFor(
      () => {
        const iframe = container.querySelector('iframe');
        expect(iframe).toBeInTheDocument();
        expect(iframe?.getAttribute('src')).toBe(defaultContextValue.iframeUrl);
      },
      { timeout: 1000 },
    );
  });

  it('responds to JWT ready message from iframe', async () => {
    const testToken = 'test-jwt-token-12345';
    localStorage.setItem(LOCALSTORAGE_KEYS.EDX_TOKEN_KEY, testToken);

    const { container } = renderEdxIframe();

    await waitFor(
      () => {
        const iframe = container.querySelector('iframe');
        expect(iframe).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const iframe = container.querySelector('iframe');
    const mockPostMessage = vi.fn();

    // Mock contentWindow
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage: mockPostMessage },
      writable: true,
      configurable: true,
    });

    // Simulate the MFE sending a ready message
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'auth.jwt.ready' },
          origin: 'https://apps.learn.example.com',
        }),
      );
    });

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          type: 'auth.jwt.token',
          edx_jwt_token: testToken,
        },
        'https://apps.learn.example.com',
      );
    });
  });

  it('does not send JWT token if not in localStorage', async () => {
    // Don't set any token in localStorage
    const { container } = renderEdxIframe();

    await waitFor(
      () => {
        const iframe = container.querySelector('iframe');
        expect(iframe).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const iframe = container.querySelector('iframe');
    const mockPostMessage = vi.fn();

    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage: mockPostMessage },
      writable: true,
      configurable: true,
    });

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'auth.jwt.ready' },
          origin: 'https://apps.learn.example.com',
        }),
      );
    });

    // Should not have been called since no token
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('calls refetchCourseOutline when iframe loads', async () => {
    const { container } = renderEdxIframe();

    await waitFor(
      () => {
        const iframe = container.querySelector('iframe');
        expect(iframe).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();

    await act(async () => {
      fireEvent.load(iframe!);
    });

    expect(mockRefetchCourseOutline).toHaveBeenCalledWith(false);
  });

  it('rejects messages from wrong origin', async () => {
    const testToken = 'test-jwt-token-12345';
    localStorage.setItem(LOCALSTORAGE_KEYS.EDX_TOKEN_KEY, testToken);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = renderEdxIframe();

    await waitFor(
      () => {
        const iframe = container.querySelector('iframe');
        expect(iframe).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const iframe = container.querySelector('iframe');
    const mockPostMessage = vi.fn();

    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage: mockPostMessage },
      writable: true,
      configurable: true,
    });

    // Simulate message from wrong origin
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'auth.jwt.ready' },
          origin: 'https://malicious-site.com',
        }),
      );
    });

    // Should not have been called due to origin mismatch
    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Origin mismatch'),
      expect.any(Object),
    );

    consoleErrorSpy.mockRestore();
  });

  describe('active tab routing to getIframeURL', () => {
    it("passes the courseOutline object when activeTab is 'course'", async () => {
      renderEdxIframe({ ...defaultContextValue, activeTab: 'course' });

      await waitFor(() => {
        expect(mockGetIframeURL).toHaveBeenCalled();
      });

      const [courseIdArg, courseInfoArg] = mockGetIframeURL.mock.calls[0];
      expect(courseIdArg).toBe(defaultContextValue.courseID);
      expect(courseInfoArg).toBe(defaultContextValue.courseOutline);
    });

    it("passes the courseOutline object when activeTab is 'agent' (not the literal 'agent' string)", async () => {
      // Regression test: previously 'agent' was passed as xblockID, producing a
      // bogus /xblock/agent SSO redirect. The agent tab must route through the
      // same course-unit path as the course tab.
      renderEdxIframe({ ...defaultContextValue, activeTab: 'agent' });

      await waitFor(() => {
        expect(mockGetIframeURL).toHaveBeenCalled();
      });

      const [, courseInfoArg] = mockGetIframeURL.mock.calls[0];
      expect(courseInfoArg).toBe(defaultContextValue.courseOutline);
      expect(courseInfoArg).not.toBe('agent');
    });

    it.each(['forum', 'notes', 'progress', 'dates', 'bookmarks'])(
      "passes the activeTab string when activeTab is '%s'",
      async (tab) => {
        renderEdxIframe({ ...defaultContextValue, activeTab: tab });

        await waitFor(() => {
          expect(mockGetIframeURL).toHaveBeenCalled();
        });

        const [, courseInfoArg] = mockGetIframeURL.mock.calls[0];
        expect(courseInfoArg).toBe(tab);
      },
    );
  });
});
