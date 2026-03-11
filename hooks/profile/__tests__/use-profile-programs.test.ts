import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserId: vi.fn(() => 42),
  getUserName: vi.fn(() => 'test-user'),
  getOrg: vi.fn(() => 'test-org'),
  getRandomCourseImage: vi.fn(() => '/images/courses/c1s.jpeg'),
}));

const mockGetProgramList = vi.fn();
const mockGetProgramCompletion = vi.fn();
const mockGetUserEnrolledPrograms = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetProgramCompletionQuery: vi.fn(() => [mockGetProgramCompletion]),
  useLazyGetProgramListQuery: vi.fn(() => [mockGetProgramList, { isError: false }]),
  useLazyGetUserEnrolledProgramsQuery: vi.fn(() => [
    mockGetUserEnrolledPrograms,
    { isError: false },
  ]),
}));

const mockGetAssignedPrograms = vi.fn();
vi.mock('@/services/catalog', () => ({
  useLazyGetAssignedProgramsQuery: vi.fn(() => [
    mockGetAssignedPrograms,
    { isError: false },
  ]),
}));

vi.mock('@iblai/iblai-api', () => ({}));

import { useProfilePrograms } from '../use-profile-programs';

describe('useProfilePrograms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProgramList.mockResolvedValue({ data: [] });
    mockGetUserEnrolledPrograms.mockResolvedValue({ data: [] });
    mockGetAssignedPrograms.mockResolvedValue({ data: { results: [] } });
    mockGetProgramCompletion.mockResolvedValue({ data: {} });
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() =>
      useProfilePrograms({ searchQuery: '', activeTab: 'enrolled' }),
    );
    expect(result.current).toHaveProperty('programs');
    expect(result.current).toHaveProperty('filteredPrograms');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('setFilteredPrograms');
    expect(result.current).toHaveProperty('setPrograms');
    expect(result.current).toHaveProperty('programCompletions');
    expect(result.current).toHaveProperty('programCompletionsLoading');
  });

  it('fetches enrolled programs on mount when activeTab is enrolled', async () => {
    const mockPrograms = [{ name: 'Program 1', program_key: 'prog-1', metadata: {} }];
    mockGetUserEnrolledPrograms.mockResolvedValue({ data: mockPrograms });

    const { result } = renderHook(() =>
      useProfilePrograms({ searchQuery: '', activeTab: 'enrolled' }),
    );

    await waitFor(() => {
      expect(mockGetUserEnrolledPrograms).toHaveBeenCalled();
      expect(result.current.programs.length).toBe(1);
    });
  });

  it('fetches assigned programs when activeTab is assigned', async () => {
    const mockPrograms = [{ name: 'Assigned Program', program_key: 'prog-2' }];
    mockGetAssignedPrograms.mockResolvedValue({ data: { results: mockPrograms } });

    const { result } = renderHook(() =>
      useProfilePrograms({ searchQuery: '', activeTab: 'assigned' }),
    );

    await waitFor(() => {
      expect(mockGetAssignedPrograms).toHaveBeenCalled();
      expect(result.current.programs.length).toBe(1);
    });
  });

  it('fetches catalog programs when activeTab is catalog', async () => {
    const mockPrograms = [{ name: 'Catalog Program', program_key: 'prog-3', metadata: {} }];
    mockGetProgramList.mockResolvedValue({ data: mockPrograms });

    const { result } = renderHook(() =>
      useProfilePrograms({ searchQuery: '', activeTab: 'catalog' }),
    );

    await waitFor(() => {
      expect(mockGetProgramList).toHaveBeenCalled();
      expect(result.current.programs.length).toBe(1);
    });
  });

  it('filters programs by searchQuery when length > 2', async () => {
    const mockPrograms = [
      { name: 'Python Program', program_key: 'prog-1', metadata: {} },
      { name: 'JavaScript Program', program_key: 'prog-2', metadata: {} },
    ];
    mockGetUserEnrolledPrograms.mockResolvedValue({ data: mockPrograms });

    const { result, rerender } = renderHook(
      ({ search }) => useProfilePrograms({ searchQuery: search, activeTab: 'enrolled' }),
      { initialProps: { search: '' } },
    );

    await waitFor(() => {
      expect(result.current.programs.length).toBe(2);
    });

    rerender({ search: 'Python' });

    await waitFor(() => {
      expect(result.current.filteredPrograms.length).toBe(1);
      expect(result.current.filteredPrograms[0].name).toBe('Python Program');
    });
  });

  it('shows all programs when searchQuery length <= 2', async () => {
    const mockPrograms = [
      { name: 'Program 1', program_key: 'prog-1', metadata: {} },
      { name: 'Program 2', program_key: 'prog-2', metadata: {} },
    ];
    mockGetUserEnrolledPrograms.mockResolvedValue({ data: mockPrograms });

    const { result, rerender } = renderHook(
      ({ search }) => useProfilePrograms({ searchQuery: search, activeTab: 'enrolled' }),
      { initialProps: { search: '' } },
    );

    await waitFor(() => {
      expect(result.current.programs.length).toBe(2);
    });

    rerender({ search: 'Pr' });

    expect(result.current.filteredPrograms.length).toBe(2);
  });

  it('adds random image to each program', async () => {
    const mockPrograms = [{ name: 'Program 1', program_key: 'prog-1', metadata: {} }];
    mockGetUserEnrolledPrograms.mockResolvedValue({ data: mockPrograms });

    const { result } = renderHook(() =>
      useProfilePrograms({ searchQuery: '', activeTab: 'enrolled' }),
    );

    await waitFor(() => {
      expect(result.current.programs[0].metadata?.image).toBe('/images/courses/c1s.jpeg');
    });
  });

  it('re-fetches when activeTab changes', async () => {
    const { result, rerender } = renderHook(
      ({ tab }) => useProfilePrograms({ searchQuery: '', activeTab: tab }),
      { initialProps: { tab: 'enrolled' as const } },
    );

    await waitFor(() => {
      expect(mockGetUserEnrolledPrograms).toHaveBeenCalledTimes(1);
    });

    rerender({ tab: 'catalog' });

    await waitFor(() => {
      expect(mockGetProgramList).toHaveBeenCalledTimes(1);
    });
  });

  it('setPrograms and setFilteredPrograms work correctly', async () => {
    const { result } = renderHook(() =>
      useProfilePrograms({ searchQuery: '', activeTab: 'enrolled' }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setPrograms([{ name: 'Custom Program' } as any]);
    });
    expect(result.current.programs).toEqual([{ name: 'Custom Program' }]);

    act(() => {
      result.current.setFilteredPrograms([{ name: 'Filtered Program' } as any]);
    });
    expect(result.current.filteredPrograms).toEqual([{ name: 'Filtered Program' }]);
  });

  it('handles program completion fetch', async () => {
    const mockPrograms = [{ name: 'Program 1', program_key: 'prog-1', metadata: {} }];
    mockGetUserEnrolledPrograms.mockResolvedValue({ data: mockPrograms });
    mockGetProgramCompletion.mockResolvedValue({ data: { completion: 50 } });

    const { result } = renderHook(() =>
      useProfilePrograms({ searchQuery: '', activeTab: 'enrolled' }),
    );

    await waitFor(() => {
      expect(result.current.programCompletionsLoading).toBe(false);
    });
  });

  it('handles program completion error gracefully', async () => {
    const mockPrograms = [{ name: 'Program 1', program_key: 'prog-1', metadata: {} }];
    mockGetUserEnrolledPrograms.mockResolvedValue({ data: mockPrograms });
    mockGetProgramCompletion.mockRejectedValue(new Error('Completion error'));

    const { result } = renderHook(() =>
      useProfilePrograms({ searchQuery: '', activeTab: 'enrolled' }),
    );

    await waitFor(() => {
      expect(result.current.programCompletions).toEqual([]);
      expect(result.current.programCompletionsLoading).toBe(false);
    });
  });
});
