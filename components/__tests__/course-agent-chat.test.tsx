import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
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

vi.mock('@iblai/agent-ai', () => ({}));

vi.mock('lodash', () => ({
  default: {
    isEmpty: vi.fn(
      (val) => !val || (Array.isArray(val) ? val.length === 0 : Object.keys(val).length === 0),
    ),
  },
}));

const defaultContextValue = {
  isOpen: false,
  setIsOpen: vi.fn(),
  courseMentor: null,
  setCourseMentor: vi.fn(),
  mentorSidebarHidden: false,
  setMentorSidebarHidden: vi.fn(),
};

import { CourseAgentChat } from '../course-agent-chat';
import { ChatContext } from '../chat-button';

const renderWithContext = (contextValue: typeof defaultContextValue = defaultContextValue) =>
  render(
    <ChatContext.Provider value={contextValue}>
      <CourseAgentChat />
    </ChatContext.Provider>,
  );

describe('CourseAgentChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMentors.mockResolvedValue({
      data: { results: [{ unique_id: 'mentor-1', metadata: { default: true } }] },
    });
    mockGetEmbeddedMentorToUse.mockReturnValue(null);
    mockUseTenantMetadata.mockReturnValue({
      getEmbeddedMentorToUse: mockGetEmbeddedMentorToUse,
      metadataLoaded: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a loader while tenant metadata is loading', () => {
    mockUseTenantMetadata.mockReturnValue({
      getEmbeddedMentorToUse: mockGetEmbeddedMentorToUse,
      metadataLoaded: false,
    });
    const { container } = renderWithContext();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders a loader while mentors are loading', async () => {
    const { useLazyGetMentorsQuery } = await import('@iblai/iblai-js/data-layer');
    // @ts-ignore
    vi.mocked(useLazyGetMentorsQuery).mockReturnValue([
      mockGetMentors,
      { isLoading: true, isFetching: false },
    ] as any);
    const { container } = renderWithContext();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders the agent-ai web component after resolving a mentor', async () => {
    const { container } = renderWithContext();
    await waitFor(() => {
      expect(container.querySelector('agent-ai')).toBeInTheDocument();
    });
  });

  it('prefers courseMentor from chat context when present', async () => {
    const contextValue = { ...defaultContextValue, courseMentor: 'course-mentor-id' };
    const { container } = renderWithContext(contextValue as any);
    await waitFor(() => {
      const el = container.querySelector('agent-ai') as HTMLElement | null;
      expect(el).toBeInTheDocument();
      expect(el?.getAttribute('mentor')).toBe('course-mentor-id');
    });
    expect(mockGetMentors).not.toHaveBeenCalled();
  });

  it('uses embedded mentor from tenant metadata when no courseMentor is provided', async () => {
    mockGetEmbeddedMentorToUse.mockReturnValue({ unique_id: 'embedded-mentor-id' } as any);
    const { container } = renderWithContext();
    await waitFor(() => {
      const el = container.querySelector('agent-ai') as HTMLElement | null;
      expect(el?.getAttribute('mentor')).toBe('embedded-mentor-id');
    });
    expect(mockGetMentors).not.toHaveBeenCalled();
  });

  it('falls back to fetching mentors and selects the default one', async () => {
    mockGetMentors.mockResolvedValue({
      data: {
        results: [
          { unique_id: 'mentor-a', metadata: { default: false } },
          { unique_id: 'mentor-b', metadata: { default: true } },
        ],
      },
    });
    const { container } = renderWithContext();
    await waitFor(() => {
      const el = container.querySelector('agent-ai') as HTMLElement | null;
      expect(el?.getAttribute('mentor')).toBe('mentor-b');
    });
  });

  it('falls back to the first mentor when none is marked default', async () => {
    mockGetMentors.mockResolvedValue({
      data: {
        results: [
          { unique_id: 'mentor-a', metadata: {} },
          { unique_id: 'mentor-b', metadata: { default: false } },
        ],
      },
    });
    const { container } = renderWithContext();
    await waitFor(() => {
      const el = container.querySelector('agent-ai') as HTMLElement | null;
      expect(el?.getAttribute('mentor')).toBe('mentor-a');
    });
  });

  it('renders nothing and shows a toast error when no mentors are found', async () => {
    mockGetMentors.mockResolvedValue({ data: { results: [] } });
    const { toast } = await import('sonner');
    const { container } = renderWithContext();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No mentors found');
    });
    expect(container.querySelector('agent-ai')).not.toBeInTheDocument();
  });

  it('renders nothing when mentor fetch rejects', async () => {
    mockGetMentors.mockRejectedValue(new Error('boom'));
    const { toast } = await import('sonner');
    const { container } = renderWithContext();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No mentors found');
    });
    expect(container.querySelector('agent-ai')).not.toBeInTheDocument();
  });

  it('errors when the selected mentor has no unique_id', async () => {
    mockGetMentors.mockResolvedValue({
      data: { results: [{ metadata: { default: true } }] },
    });
    const { toast } = await import('sonner');
    const { container } = renderWithContext();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No mentors found');
    });
    expect(container.querySelector('agent-ai')).not.toBeInTheDocument();
  });

  it('forwards mentor:unit-switched messages to the mentor iframe via postMessage', async () => {
    const { container } = renderWithContext();
    const mentorEl = await waitFor(() => {
      const el = container.querySelector('agent-ai') as HTMLElement | null;
      expect(el).toBeInTheDocument();
      return el!;
    });

    const postMessage = vi.fn();
    const iframe = { contentWindow: { postMessage } } as unknown as HTMLIFrameElement;
    const shadowRoot = {
      querySelector: vi.fn((selector: string) => (selector === 'iframe' ? iframe : null)),
    };
    Object.defineProperty(mentorEl, 'shadowRoot', {
      value: shadowRoot,
      configurable: true,
    });

    window.dispatchEvent(
      new CustomEvent('mentor:unit-switched', { detail: { message: 'switched unit' } }),
    );

    expect(shadowRoot.querySelector).toHaveBeenCalledWith('iframe');
    expect(postMessage).toHaveBeenCalledWith(
      { type: 'MENTOR:CHAT_ACTION_ADD_MESSAGE', message: 'switched unit' },
      '*',
    );
  });

  it('ignores mentor:unit-switched events with no message', async () => {
    const { container } = renderWithContext();
    const mentorEl = await waitFor(() => {
      const el = container.querySelector('agent-ai') as HTMLElement | null;
      expect(el).toBeInTheDocument();
      return el!;
    });

    const querySelector = vi.fn();
    Object.defineProperty(mentorEl, 'shadowRoot', {
      value: { querySelector },
      configurable: true,
    });

    window.dispatchEvent(new CustomEvent('mentor:unit-switched', { detail: {} }));

    expect(querySelector).not.toHaveBeenCalled();
  });

  it('removes the mentor:unit-switched listener on unmount', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderWithContext();
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('mentor:unit-switched', expect.any(Function));
  });

  describe('new-chat button', () => {
    const attachShadow = (
      mentorEl: HTMLElement,
      spinner: HTMLElement,
      iframe?: HTMLIFrameElement,
    ) => {
      Object.defineProperty(mentorEl, 'shadowRoot', {
        value: {
          querySelector: (selector: string) => {
            if (selector === '#loading-spinner') return spinner;
            if (selector === 'iframe') return iframe ?? null;
            return null;
          },
        },
        configurable: true,
      });
    };

    it('does not render the new-chat button while the spinner is visible', async () => {
      const { container } = renderWithContext();
      const mentorEl = await waitFor(() => {
        const el = container.querySelector('agent-ai') as HTMLElement | null;
        expect(el).toBeInTheDocument();
        return el!;
      });

      const spinner = document.createElement('div');
      spinner.id = 'loading-spinner';
      attachShadow(mentorEl, spinner);

      // Let the polling fallback attach the observer.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 150));
      });

      expect(container.querySelector('button[aria-label="New chat"]')).not.toBeInTheDocument();
    });

    it('renders the new-chat button once the spinner is hidden', async () => {
      const { container } = renderWithContext();
      const mentorEl = await waitFor(() => {
        const el = container.querySelector('agent-ai') as HTMLElement | null;
        expect(el).toBeInTheDocument();
        return el!;
      });

      const spinner = document.createElement('div');
      spinner.id = 'loading-spinner';
      spinner.style.display = 'none';
      attachShadow(mentorEl, spinner);

      await waitFor(() => {
        expect(container.querySelector('button[aria-label="New chat"]')).toBeInTheDocument();
      });
    });

    it('toggles the new-chat button as the spinner display style changes', async () => {
      const { container } = renderWithContext();
      const mentorEl = await waitFor(() => {
        const el = container.querySelector('agent-ai') as HTMLElement | null;
        expect(el).toBeInTheDocument();
        return el!;
      });

      const spinner = document.createElement('div');
      spinner.id = 'loading-spinner';
      spinner.style.display = 'none';
      attachShadow(mentorEl, spinner);

      await waitFor(() => {
        expect(container.querySelector('button[aria-label="New chat"]')).toBeInTheDocument();
      });

      spinner.style.display = 'block';
      await waitFor(() => {
        expect(container.querySelector('button[aria-label="New chat"]')).not.toBeInTheDocument();
      });

      spinner.style.display = 'none';
      await waitFor(() => {
        expect(container.querySelector('button[aria-label="New chat"]')).toBeInTheDocument();
      });
    });

    it('posts MENTOR:NEW_CHAT to the iframe when the button is clicked', async () => {
      const { container } = renderWithContext();
      const mentorEl = await waitFor(() => {
        const el = container.querySelector('agent-ai') as HTMLElement | null;
        expect(el).toBeInTheDocument();
        return el!;
      });

      const spinner = document.createElement('div');
      spinner.id = 'loading-spinner';
      spinner.style.display = 'none';

      const postMessage = vi.fn();
      const iframe = { contentWindow: { postMessage } } as unknown as HTMLIFrameElement;
      attachShadow(mentorEl, spinner, iframe);

      const button = await waitFor(() => {
        const b = container.querySelector(
          'button[aria-label="New chat"]',
        ) as HTMLButtonElement | null;
        expect(b).toBeInTheDocument();
        return b!;
      });

      button.click();

      expect(postMessage).toHaveBeenCalledWith({ type: 'MENTOR:NEW_CHAT' }, '*');
    });

    it('disconnects the spinner observer on unmount', async () => {
      const disconnect = vi.fn();
      const observe = vi.fn();
      const originalMO = window.MutationObserver;
      // @ts-ignore — override constructor for the duration of the test
      window.MutationObserver = vi.fn().mockImplementation(() => ({
        observe,
        disconnect,
        takeRecords: () => [],
      }));

      const { container, unmount } = renderWithContext();
      const mentorEl = await waitFor(() => {
        const el = container.querySelector('agent-ai') as HTMLElement | null;
        expect(el).toBeInTheDocument();
        return el!;
      });

      const spinner = document.createElement('div');
      spinner.id = 'loading-spinner';
      spinner.style.display = 'none';
      attachShadow(mentorEl, spinner);

      await waitFor(() => {
        expect(observe).toHaveBeenCalled();
      });

      unmount();
      expect(disconnect).toHaveBeenCalled();

      window.MutationObserver = originalMO;
    });
  });
});
