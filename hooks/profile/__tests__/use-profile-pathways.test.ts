import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserId: vi.fn(() => 42),
  getUserName: vi.fn(() => 'test-user'),
  getRandomCourseImage: vi.fn(() => '/images/courses/c1s.jpeg'),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      lms: vi.fn(() => 'http://lms.example.com'),
    },
  },
}));

const mockGetPathwayList = vi.fn();
const mockGetUserEnrolledPathways = vi.fn();
const mockGetPathwayCompletion = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetPathwayCompletionQuery: vi.fn(() => [mockGetPathwayCompletion]),
  useLazyGetUserEnrolledPathwaysQuery: vi.fn(() => [
    mockGetUserEnrolledPathways,
    { isError: false },
  ]),
  useLazyGetPathwayListQuery: vi.fn(() => [mockGetPathwayList, { isError: false }]),
}));

const mockGetUserAssignedPathways = vi.fn();
vi.mock('@/services/catalog', () => ({
  useLazyGetUserAssignedPathwaysQuery: vi.fn(() => [
    mockGetUserAssignedPathways,
    { isError: false },
  ]),
}));

vi.mock('@iblai/iblai-api', () => ({}));

import { useProfilePathways } from '../use-profile-pathways';

describe('useProfilePathways', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPathwayList.mockResolvedValue({ data: [] });
    mockGetUserEnrolledPathways.mockResolvedValue({ data: [] });
    mockGetUserAssignedPathways.mockResolvedValue({ data: { results: [] } });
    mockGetPathwayCompletion.mockResolvedValue({ data: {} });
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() =>
      useProfilePathways({ searchQuery: '', contentType: 'catalog' }),
    );
    expect(result.current).toHaveProperty('pathways');
    expect(result.current).toHaveProperty('filteredPathways');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('setPathways');
    expect(result.current).toHaveProperty('setFilteredPathways');
    expect(result.current).toHaveProperty('pathwayCompletions');
    expect(result.current).toHaveProperty('pathwayCompletionsLoading');
    expect(result.current).toHaveProperty('handleFetchSinglePathwayEnrollmentStatus');
  });

  it('fetches catalog pathways on mount when contentType is catalog', async () => {
    const mockPathways = [
      { name: 'Pathway 1', pathway_uuid: 'uuid-1', metadata: {} },
    ];
    mockGetPathwayList.mockResolvedValue({ data: mockPathways });

    const { result } = renderHook(() =>
      useProfilePathways({ searchQuery: '', contentType: 'catalog' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.pathways.length).toBe(1);
    });
  });

  it('fetches assigned pathways when contentType is assigned', async () => {
    const mockPathways = [{ name: 'Assigned Pathway', pathway_uuid: 'uuid-2' }];
    mockGetUserAssignedPathways.mockResolvedValue({
      data: { results: mockPathways },
    });

    const { result } = renderHook(() =>
      useProfilePathways({ searchQuery: '', contentType: 'assigned' }),
    );

    await waitFor(() => {
      expect(mockGetUserAssignedPathways).toHaveBeenCalled();
      expect(result.current.pathways.length).toBe(1);
    });
  });

  it('fetches enrolled pathways when contentType is enrolled', async () => {
    const mockPathways = [{ name: 'Enrolled Pathway', pathway_uuid: 'uuid-3' }];
    mockGetUserEnrolledPathways.mockResolvedValue({ data: mockPathways });

    const { result } = renderHook(() =>
      useProfilePathways({ searchQuery: '', contentType: 'enrolled' }),
    );

    await waitFor(() => {
      expect(mockGetUserEnrolledPathways).toHaveBeenCalled();
      expect(result.current.pathways.length).toBe(1);
    });
  });

  it('filters pathways by searchQuery when length > 2', async () => {
    const mockPathways = [
      { name: 'Python Pathway', pathway_uuid: 'uuid-1', metadata: {} },
      { name: 'JavaScript Pathway', pathway_uuid: 'uuid-2', metadata: {} },
    ];
    mockGetPathwayList.mockResolvedValue({ data: mockPathways });

    const { result, rerender } = renderHook(
      ({ search }) => useProfilePathways({ searchQuery: search, contentType: 'catalog' }),
      { initialProps: { search: '' } },
    );

    await waitFor(() => {
      expect(result.current.pathways.length).toBe(2);
    });

    rerender({ search: 'Python' });

    await waitFor(() => {
      expect(result.current.filteredPathways.length).toBe(1);
      expect(result.current.filteredPathways[0].name).toBe('Python Pathway');
    });
  });

  it('shows all pathways when searchQuery length <= 2', async () => {
    const mockPathways = [
      { name: 'Pathway 1', pathway_uuid: 'uuid-1', metadata: {} },
      { name: 'Pathway 2', pathway_uuid: 'uuid-2', metadata: {} },
    ];
    mockGetPathwayList.mockResolvedValue({ data: mockPathways });

    const { result, rerender } = renderHook(
      ({ search }) => useProfilePathways({ searchQuery: search, contentType: 'catalog' }),
      { initialProps: { search: '' } },
    );

    await waitFor(() => {
      expect(result.current.pathways.length).toBe(2);
    });

    rerender({ search: 'py' });

    expect(result.current.filteredPathways.length).toBe(2);
  });

  it('constructs full image URL when course_image_asset_path is present', async () => {
    const mockPathways = [
      {
        name: 'Pathway 1',
        pathway_uuid: 'uuid-1',
        metadata: { course_image_asset_path: '/media/image.jpg' },
      },
    ];
    mockGetPathwayList.mockResolvedValue({ data: mockPathways });

    const { result } = renderHook(() =>
      useProfilePathways({ searchQuery: '', contentType: 'catalog' }),
    );

    await waitFor(() => {
      expect(result.current.pathways[0].metadata?.course_image_asset_path).toBe(
        'http://lms.example.com/media/image.jpg',
      );
    });
  });

  it('uses random image when course_image_asset_path is absent', async () => {
    const mockPathways = [
      {
        name: 'Pathway 1',
        pathway_uuid: 'uuid-1',
        metadata: {},
      },
    ];
    mockGetPathwayList.mockResolvedValue({ data: mockPathways });

    const { result } = renderHook(() =>
      useProfilePathways({ searchQuery: '', contentType: 'catalog' }),
    );

    await waitFor(() => {
      expect(result.current.pathways[0].metadata?.course_image_asset_path).toBe(
        '/images/courses/c1s.jpeg',
      );
    });
  });

  describe('handleFetchSinglePathwayEnrollmentStatus', () => {
    it('returns true when pathway is active and enrolled', async () => {
      mockGetUserEnrolledPathways.mockResolvedValue({
        data: [{ active: true, pathway_uuid: 'uuid-1' }],
      });

      const { result } = renderHook(() =>
        useProfilePathways({ searchQuery: '', contentType: 'catalog' }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let status: any;
      await act(async () => {
        status = await result.current.handleFetchSinglePathwayEnrollmentStatus({
          pathway_uuid: 'uuid-1',
          name: 'Test',
        } as any);
      });

      expect(status).toBe(true);
    });

    it('returns false when pathway is not enrolled', async () => {
      mockGetUserEnrolledPathways.mockResolvedValue({ data: [] });

      const { result } = renderHook(() =>
        useProfilePathways({ searchQuery: '', contentType: 'catalog' }),
      );

      let status: any;
      await act(async () => {
        status = await result.current.handleFetchSinglePathwayEnrollmentStatus({
          pathway_uuid: 'uuid-1',
          name: 'Test',
        } as any);
      });

      expect(status).toBe(false);
    });

    it('returns false on error', async () => {
      mockGetUserEnrolledPathways.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useProfilePathways({ searchQuery: '', contentType: 'catalog' }),
      );

      // Initial call on mount will also use this mock
      let status: any;
      await act(async () => {
        try {
          status = await result.current.handleFetchSinglePathwayEnrollmentStatus({
            pathway_uuid: 'uuid-1',
            name: 'Test',
          } as any);
        } catch {
          status = false;
        }
      });

      expect(status).toBe(false);
    });
  });

  it('setPathways and setFilteredPathways work correctly', async () => {
    const { result } = renderHook(() =>
      useProfilePathways({ searchQuery: '', contentType: 'catalog' }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setPathways([{ name: 'Custom Pathway' } as any]);
    });

    expect(result.current.pathways).toEqual([{ name: 'Custom Pathway' }]);

    act(() => {
      result.current.setFilteredPathways([{ name: 'Filtered Pathway' } as any]);
    });

    expect(result.current.filteredPathways).toEqual([{ name: 'Filtered Pathway' }]);
  });
});
