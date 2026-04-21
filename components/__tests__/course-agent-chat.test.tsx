import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
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

vi.mock('@iblai/iblai-web-mentor', () => ({}));

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

  it('renders the mentor-ai web component after resolving a mentor', async () => {
    const { container } = renderWithContext();
    await waitFor(() => {
      expect(container.querySelector('mentor-ai')).toBeInTheDocument();
    });
  });

  it('prefers courseMentor from chat context when present', async () => {
    const contextValue = { ...defaultContextValue, courseMentor: 'course-mentor-id' };
    const { container } = renderWithContext(contextValue as any);
    await waitFor(() => {
      const el = container.querySelector('mentor-ai') as HTMLElement | null;
      expect(el).toBeInTheDocument();
      expect(el?.getAttribute('mentor')).toBe('course-mentor-id');
    });
    expect(mockGetMentors).not.toHaveBeenCalled();
  });

  it('uses embedded mentor from tenant metadata when no courseMentor is provided', async () => {
    mockGetEmbeddedMentorToUse.mockReturnValue({ unique_id: 'embedded-mentor-id' } as any);
    const { container } = renderWithContext();
    await waitFor(() => {
      const el = container.querySelector('mentor-ai') as HTMLElement | null;
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
      const el = container.querySelector('mentor-ai') as HTMLElement | null;
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
      const el = container.querySelector('mentor-ai') as HTMLElement | null;
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
    expect(container.querySelector('mentor-ai')).not.toBeInTheDocument();
  });

  it('renders nothing when mentor fetch rejects', async () => {
    mockGetMentors.mockRejectedValue(new Error('boom'));
    const { toast } = await import('sonner');
    const { container } = renderWithContext();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No mentors found');
    });
    expect(container.querySelector('mentor-ai')).not.toBeInTheDocument();
  });
});
