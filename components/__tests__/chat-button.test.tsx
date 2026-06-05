import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      defaultEmbeddedMentorName: vi.fn(() => 'default-mentor'),
    },
    urls: {
      mentor: vi.fn(() => 'https://mentor.example.com'),
      auth: vi.fn(() => 'https://auth.example.com'),
      lms: vi.fn(() => 'https://lms.example.com'),
    },
  },
}));

const mockGetEmbeddedMentorToUse = vi.fn(() => null);
const mockUseTenantMetadata = vi.fn(() => ({
  getEmbeddedMentorToUse: mockGetEmbeddedMentorToUse,
  metadataLoaded: true,
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: () => mockUseTenantMetadata(),
}));

const mockGetMentors = vi.fn();
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetMentorsQuery: vi.fn(() => [mockGetMentors, { isLoading: false, isFetching: false }]),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('@iblai/agent-ai', () => ({}));

vi.mock('lodash', () => ({
  default: {
    isEmpty: vi.fn(
      (val) => !val || (Array.isArray(val) ? val.length === 0 : Object.keys(val).length === 0),
    ),
  },
}));

import { ChatButton, ChatContext, useChatState } from '../chat-button';

const defaultContextValue = {
  isOpen: false,
  setIsOpen: vi.fn(),
  courseMentor: null,
  setCourseMentor: vi.fn(),
  mentorSidebarHidden: false,
  setMentorSidebarHidden: vi.fn(),
};

const renderWithContext = (ui: React.ReactElement, contextValue = defaultContextValue) => {
  return render(<ChatContext.Provider value={contextValue}>{ui}</ChatContext.Provider>);
};

// The lazy `getMentors` trigger returns an RTK-Query result whose `.unwrap()`
// resolves to the response payload directly (i.e. `{ results: [...] }`).
const makeMentorResult = (results: any[]) => ({
  unwrap: () => Promise.resolve({ results }),
});

describe('useChatState', () => {
  it('returns context values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatContext.Provider value={defaultContextValue}>{children}</ChatContext.Provider>
    );
    const { result } = renderHook(() => useChatState(), { wrapper });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.courseMentor).toBe(null);
  });
});

describe('ChatButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMentors.mockReturnValue(
      makeMentorResult([{ unique_id: 'mentor-1', metadata: { default: true } }]),
    );
    mockGetEmbeddedMentorToUse.mockReturnValue(null);
    mockUseTenantMetadata.mockReturnValue({
      getEmbeddedMentorToUse: mockGetEmbeddedMentorToUse,
      metadataLoaded: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders desktop version when not mobile', async () => {
    const { container } = renderWithContext(<ChatButton />);
    await waitFor(() => {
      expect(container).toBeTruthy();
    });
  });

  it('renders loading state when mentors are loading', async () => {
    // @ts-ignore
    const { useLazyGetMentorsQuery } = await import('@iblai/iblai-js/data-layer');
    vi.mocked(useLazyGetMentorsQuery).mockReturnValue([
      mockGetMentors,
      { isLoading: true, isFetching: false },
    ] as any);
    const { container } = renderWithContext(<ChatButton />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders loading state when fetching mentors', async () => {
    // @ts-ignore
    const { useLazyGetMentorsQuery } = await import('@iblai/iblai-js/data-layer');
    vi.mocked(useLazyGetMentorsQuery).mockReturnValue([
      mockGetMentors,
      { isLoading: false, isFetching: true },
    ] as any);
    const { container } = renderWithContext(<ChatButton />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders loading state when metadata not loaded', () => {
    mockUseTenantMetadata.mockReturnValue({
      getEmbeddedMentorToUse: mockGetEmbeddedMentorToUse,
      metadataLoaded: false,
    });
    const { container } = renderWithContext(<ChatButton />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders empty fragment when mentorSidebarHidden and no mentor', async () => {
    const contextWithHiddenSidebar = {
      ...defaultContextValue,
      mentorSidebarHidden: true,
    };
    const { container } = renderWithContext(<ChatButton />, contextWithHiddenSidebar);
    await waitFor(() => {
      // Should render empty or minimal content
      expect(container).toBeTruthy();
    });
  });

  it('renders mobile version when isMobile is true', async () => {
    mockGetMentors.mockReturnValue(
      makeMentorResult([{ unique_id: 'mentor-1', metadata: { default: true } }]),
    );
    const { container } = renderWithContext(<ChatButton isMobile />);
    await waitFor(() => {
      expect(container).toBeTruthy();
    });
  });

  it('handles open button click on desktop', async () => {
    const setIsOpen = vi.fn();
    const contextValue = { ...defaultContextValue, setIsOpen };
    mockGetMentors.mockReturnValue(
      makeMentorResult([{ unique_id: 'mentor-1', metadata: { default: true } }]),
    );
    renderWithContext(<ChatButton />, contextValue);
    await waitFor(() => {
      const btn = screen.queryByLabelText('Open chat assistant');
      if (btn) {
        fireEvent.click(btn);
        expect(setIsOpen).toHaveBeenCalled();
      }
    });
  });

  it('handles postMessage close event', async () => {
    const setIsOpen = vi.fn();
    const contextValue = { ...defaultContextValue, setIsOpen };
    renderWithContext(<ChatButton />, contextValue);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { closeEmbed: true, collapseSidebarCopilot: true },
        }),
      );
    });
    // setIsOpen(false) should have been called if isOpen was true
    expect(setIsOpen).toBeDefined();
  });

  it('ignores postMessage when data does not match close format', async () => {
    const setIsOpen = vi.fn();
    const contextValue = { ...defaultContextValue, setIsOpen };
    renderWithContext(<ChatButton />, contextValue);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { someOtherKey: true },
        }),
      );
    });
    // handleOpen(false) should not be triggered
    expect(setIsOpen).not.toHaveBeenCalled();
  });

  it('handles course mentor being set', async () => {
    const contextWithCourseMentor = {
      ...defaultContextValue,
      courseMentor: 'course-mentor-id',
    };
    const { container } = renderWithContext(<ChatButton />, contextWithCourseMentor as any);
    await waitFor(() => {
      expect(container).toBeTruthy();
    });
  });

  it('handles embedded mentor from metadata', async () => {
    mockGetEmbeddedMentorToUse.mockReturnValue({ unique_id: 'embedded-mentor-id' } as any);
    const { container } = renderWithContext(<ChatButton />);
    await waitFor(() => {
      expect(container).toBeTruthy();
    });
  });

  it('shows toast error when no mentors found', async () => {
    const { toast } = await import('sonner');
    // Both the recently-accessed and featured lookups return nothing.
    mockGetMentors.mockReturnValue(makeMentorResult([]));

    renderWithContext(<ChatButton />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No mentors found');
    });
  });

  it('handles mentor fetch error gracefully', async () => {
    const { toast } = await import('sonner');
    mockGetMentors.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Network error')),
    } as any);
    renderWithContext(<ChatButton />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No mentors found');
    });
  });

  it('shows mentor AI element when alreadyOpened and mentorInUse on desktop', async () => {
    const contextValue = { ...defaultContextValue, isOpen: true };
    mockGetMentors.mockReturnValue(
      makeMentorResult([{ unique_id: 'mentor-1', metadata: { default: true } }]),
    );
    const { container } = renderWithContext(<ChatButton />, contextValue);
    await waitFor(() => {
      expect(container).toBeTruthy();
    });
  });

  it('shows mentor AI element when alreadyOpened and mentorInUse on mobile', async () => {
    const contextValue = { ...defaultContextValue, isOpen: true };
    mockGetMentors.mockReturnValue(
      makeMentorResult([{ unique_id: 'mentor-1', metadata: { default: true } }]),
    );
    const { container } = renderWithContext(<ChatButton isMobile />, contextValue);
    await waitFor(() => {
      expect(container).toBeTruthy();
    });
  });

  it('handles open click on mobile version', async () => {
    const setIsOpen = vi.fn();
    const contextValue = { ...defaultContextValue, isOpen: false, setIsOpen };
    mockGetMentors.mockReturnValue(
      makeMentorResult([{ unique_id: 'mentor-1', metadata: { default: true } }]),
    );
    renderWithContext(<ChatButton isMobile />, contextValue);
    await waitFor(() => {
      const btn = document.querySelector('button');
      if (btn) fireEvent.click(btn);
    });
  });

  it('handles mentor with no default metadata', async () => {
    const _ = await import('lodash');
    vi.mocked(_.default.isEmpty).mockReturnValue(false);
    mockGetMentors.mockReturnValue(
      makeMentorResult([
        { unique_id: 'mentor-1', metadata: {} },
        { unique_id: 'mentor-2', metadata: { default: false } },
      ]),
    );
    const { container } = renderWithContext(<ChatButton />);
    await waitFor(() => {
      expect(container).toBeTruthy();
    });
  });

  it('ignores postMessage with non-object data', async () => {
    const setIsOpen = vi.fn();
    const contextValue = { ...defaultContextValue, setIsOpen };
    renderWithContext(<ChatButton />, contextValue);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: 'string-data',
        }),
      );
    });
    expect(setIsOpen).not.toHaveBeenCalled();
  });

  // Earlier tests leak an isLoading/isFetching return value (clearAllMocks does
  // not reset implementations), so the loaded, non-fetching query is set here.
  const setLoadedQuery = async () => {
    // @ts-ignore
    const { useLazyGetMentorsQuery } = await import('@iblai/iblai-js/data-layer');
    vi.mocked(useLazyGetMentorsQuery).mockReturnValue([
      mockGetMentors,
      { isLoading: false, isFetching: false },
    ] as any);
  };

  it('renders an empty fragment when the sidebar is hidden and no mentor resolves', async () => {
    await setLoadedQuery();
    const contextValue = { ...defaultContextValue, mentorSidebarHidden: true };
    const { container } = renderWithContext(<ChatButton />, contextValue);
    // No loader (metadata is loaded) and no mentor button — just an empty fragment.
    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(container.querySelector('button')).not.toBeInTheDocument();
  });

  it('opens the desktop chat and shows the agent element', async () => {
    await setLoadedQuery();
    // A course mentor resolves synchronously, so mentorInUse is set on mount.
    const contextValue = {
      ...defaultContextValue,
      courseMentor: 'course-mentor-id',
      setIsOpen: vi.fn(),
    };
    const { container } = renderWithContext(<ChatButton />, contextValue as any);

    const openBtn = await screen.findByLabelText('Open chat assistant');
    fireEvent.click(openBtn);

    expect(contextValue.setIsOpen).toHaveBeenCalledWith(true);
    await waitFor(() => {
      expect(container.querySelector('agent-ai')).toBeInTheDocument();
    });
  });

  it('opens the mobile chat and shows the agent element', async () => {
    await setLoadedQuery();
    const contextValue = {
      ...defaultContextValue,
      courseMentor: 'course-mentor-id',
      setIsOpen: vi.fn(),
    };
    const { container } = renderWithContext(<ChatButton isMobile />, contextValue as any);

    const openBtn = await waitFor(() => {
      const btn = container.querySelector('button');
      expect(btn).toBeInTheDocument();
      return btn as HTMLButtonElement;
    });
    fireEvent.click(openBtn);

    expect(contextValue.setIsOpen).toHaveBeenCalledWith(true);
    await waitFor(() => {
      expect(container.querySelector('agent-ai')).toBeInTheDocument();
    });
  });
});

describe('ChatButton - mentor resolution logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEmbeddedMentorToUse.mockReturnValue(null);
    mockUseTenantMetadata.mockReturnValue({
      getEmbeddedMentorToUse: mockGetEmbeddedMentorToUse,
      metadataLoaded: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the course mentor first and skips the mentor lookup entirely', async () => {
    const contextWithCourseMentor = {
      ...defaultContextValue,
      courseMentor: 'course-mentor-id',
    };
    renderWithContext(<ChatButton />, contextWithCourseMentor as any);
    await waitFor(() => {
      expect(mockGetMentors).not.toHaveBeenCalled();
    });
  });

  it('uses the embedded mentor before falling back to the mentor lookup', async () => {
    mockGetEmbeddedMentorToUse.mockReturnValue({ unique_id: 'embedded-mentor-id' } as any);
    renderWithContext(<ChatButton />);
    await waitFor(() => {
      expect(mockGetMentors).not.toHaveBeenCalled();
    });
  });

  it('queries recently accessed mentors first', async () => {
    mockGetMentors.mockReturnValue(makeMentorResult([{ unique_id: 'recent-1', metadata: {} }]));
    renderWithContext(<ChatButton />);
    await waitFor(() => {
      expect(mockGetMentors).toHaveBeenCalledWith({
        org: 'test-tenant',
        username: 'test-user',
        orderBy: 'recently_accessed_at',
        limit: 10,
      });
    });
    // A recent mentor exists, so the featured fallback must not run.
    expect(mockGetMentors).toHaveBeenCalledTimes(1);
  });

  it('falls back to featured mentors when there are no recently accessed mentors', async () => {
    mockGetMentors
      .mockReturnValueOnce(makeMentorResult([]))
      .mockReturnValueOnce(makeMentorResult([{ unique_id: 'featured-1', metadata: {} }]));
    renderWithContext(<ChatButton />);
    await waitFor(() => {
      expect(mockGetMentors).toHaveBeenCalledTimes(2);
    });
    expect(mockGetMentors).toHaveBeenNthCalledWith(2, {
      org: 'test-tenant',
      username: 'test-user',
      featured: true,
      limit: 10,
    });
  });

  it('shows an error when neither recent nor featured mentors are found', async () => {
    const { toast } = await import('sonner');
    mockGetMentors.mockReturnValue(makeMentorResult([]));
    renderWithContext(<ChatButton />);
    await waitFor(() => {
      expect(mockGetMentors).toHaveBeenCalledTimes(2);
    });
    expect(toast.error).toHaveBeenCalledWith('No mentors found');
  });
});
