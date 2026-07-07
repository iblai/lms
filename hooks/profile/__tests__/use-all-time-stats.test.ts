import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserId: vi.fn(() => 42),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockGetUserReportedSkills = vi.fn();
const mockGetUserDesiredSkills = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetUserReportedSkillsQuery: vi.fn(() => [mockGetUserReportedSkills, { isError: false }]),
  useLazyGetUserDesiredSkillsQuery: vi.fn(() => [mockGetUserDesiredSkills, { isError: false }]),
}));

const mockGetUserCredentials = vi.fn();
vi.mock('@/services/credentials', () => ({
  useLazyGetUserCredentialsQuery: vi.fn(() => [mockGetUserCredentials, { isError: false }]),
}));

const mockGetUserEnrolledCourses = vi.fn();
vi.mock('@/services/courses', () => ({
  useLazyGetUserEnrolledCoursesQuery: vi.fn(() => [mockGetUserEnrolledCourses, { isError: false }]),
}));

import { useAllTimeStats } from '../use-all-time-stats';

describe('useAllTimeStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserReportedSkills.mockResolvedValue({ data: null });
    mockGetUserDesiredSkills.mockResolvedValue({ data: null });
    mockGetUserCredentials.mockResolvedValue({ data: null });
    mockGetUserEnrolledCourses.mockResolvedValue({ data: null });
  });

  it('returns expected shape with zero defaults', () => {
    const { result } = renderHook(() => useAllTimeStats());
    expect(result.current.courses).toBe(0);
    expect(result.current.credentials).toBe(0);
    expect(result.current.skills).toBe(0);
  });

  it('updates skills count from reported and desired skills', async () => {
    mockGetUserReportedSkills.mockResolvedValue({
      data: { skills: [{ name: 'Python' }, { name: 'JavaScript' }] },
    });
    mockGetUserDesiredSkills.mockResolvedValue({
      data: { skills: [{ name: 'React' }] },
    });

    const { result } = renderHook(() => useAllTimeStats());

    await waitFor(() => {
      expect(result.current.skills).toBe(3);
    });
  });

  it('updates credentials count', async () => {
    mockGetUserCredentials.mockResolvedValue({
      data: { data: [{ id: 'cred-1' }, { id: 'cred-2' }] },
    });

    const { result } = renderHook(() => useAllTimeStats());

    await waitFor(() => {
      expect(result.current.credentials).toBe(2);
    });
  });

  it('updates courses count', async () => {
    mockGetUserEnrolledCourses.mockResolvedValue({
      data: { count: 5 },
    });

    const { result } = renderHook(() => useAllTimeStats());

    await waitFor(() => {
      expect(result.current.courses).toBe(5);
    });
  });

  it('keeps counts at 0 on empty responses', async () => {
    const { result } = renderHook(() => useAllTimeStats());

    await waitFor(() => {
      expect(mockGetUserEnrolledCourses).toHaveBeenCalled();
    });
    expect(result.current.courses).toBe(0);
    expect(result.current.credentials).toBe(0);
    expect(result.current.skills).toBe(0);
  });

  it('keeps counts at 0 when fetches reject', async () => {
    mockGetUserReportedSkills.mockRejectedValue(new Error('network'));
    mockGetUserDesiredSkills.mockRejectedValue(new Error('network'));
    mockGetUserCredentials.mockRejectedValue(new Error('network'));
    mockGetUserEnrolledCourses.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAllTimeStats());

    await waitFor(() => {
      expect(mockGetUserEnrolledCourses).toHaveBeenCalled();
    });
    expect(result.current.courses).toBe(0);
    expect(result.current.credentials).toBe(0);
    expect(result.current.skills).toBe(0);
  });
});
