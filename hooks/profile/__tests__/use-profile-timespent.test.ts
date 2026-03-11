import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockGetOverTimeActivity = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetOverTimeActivityQuery: vi.fn(() => [
    mockGetOverTimeActivity,
    { isError: false },
  ]),
}));

import { useProfileTimeSpent } from '../use-profile-timespent';

describe('useProfileTimeSpent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOverTimeActivity.mockResolvedValue({ data: null });
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useProfileTimeSpent());
    expect(result.current).toHaveProperty('timeSpent');
    expect(result.current).toHaveProperty('timeSpentLoading');
  });

  it('initializes with empty timeSpent array', () => {
    const { result } = renderHook(() => useProfileTimeSpent());
    expect(result.current.timeSpent).toEqual([]);
  });

  it('fetches time spent data on mount', async () => {
    const { result } = renderHook(() => useProfileTimeSpent());
    await waitFor(() => {
      expect(mockGetOverTimeActivity).toHaveBeenCalled();
    });
  });

  it('transforms and sets timeSpent data on success', async () => {
    const activityData = {
      '2024-01-01': 3600,
      '2024-01-02': 1800,
    };
    mockGetOverTimeActivity.mockResolvedValue({
      data: { data: activityData },
    });

    const { result } = renderHook(() => useProfileTimeSpent());

    await waitFor(() => {
      expect(result.current.timeSpent.length).toBe(2);
      expect(result.current.timeSpentLoading).toBe(false);
    });

    expect(result.current.timeSpent[0]).toHaveProperty('date');
    expect(result.current.timeSpent[0]).toHaveProperty('minutes');
    // 3600 seconds = 60 minutes
    expect(result.current.timeSpent[0].minutes).toBe(60);
    // 1800 seconds = 30 minutes
    expect(result.current.timeSpent[1].minutes).toBe(30);
  });

  it('sets empty timeSpent on empty data response', async () => {
    mockGetOverTimeActivity.mockResolvedValue({ data: { data: {} } });

    const { result } = renderHook(() => useProfileTimeSpent());

    await waitFor(() => {
      expect(result.current.timeSpent).toEqual([]);
      expect(result.current.timeSpentLoading).toBe(false);
    });
  });

  it('sets empty timeSpent on null data', async () => {
    mockGetOverTimeActivity.mockResolvedValue({ data: null });

    const { result } = renderHook(() => useProfileTimeSpent());

    await waitFor(() => {
      expect(result.current.timeSpent).toEqual([]);
      expect(result.current.timeSpentLoading).toBe(false);
    });
  });

  it('sets empty timeSpent on error', async () => {
    mockGetOverTimeActivity.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProfileTimeSpent());

    await waitFor(() => {
      expect(result.current.timeSpent).toEqual([]);
      expect(result.current.timeSpentLoading).toBe(false);
    });
  });

  it('calls getOverTimeActivity with correct params', async () => {
    const { result } = renderHook(() => useProfileTimeSpent());

    await waitFor(() => {
      expect(mockGetOverTimeActivity).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            org: 'test-tenant',
            userId: 'test-user',
            format: 'json',
          }),
        ],
        true,
      );
    });
  });

  it('formats date using dayjs ddd DD/MM/YY format', async () => {
    mockGetOverTimeActivity.mockResolvedValue({
      data: { data: { '2024-03-15': 7200 } },
    });

    const { result } = renderHook(() => useProfileTimeSpent());

    await waitFor(() => {
      expect(result.current.timeSpent.length).toBe(1);
    });

    // Should be formatted as 'ddd DD/MM/YY'
    expect(result.current.timeSpent[0].date).toMatch(/\w{3} \d{2}\/\d{2}\/\d{2}/);
  });
});
