import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserId: vi.fn(() => 42),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockGetUserSkillsPoints = vi.fn();
const mockGetUserReportedSkills = vi.fn();
const mockGetUserDesiredSkills = vi.fn();
const mockGetPerLearnerInfo = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetUserReportedSkillsQuery: vi.fn(() => [mockGetUserReportedSkills, { isError: false }]),
  useLazyGetUserSkillsPointsQuery: vi.fn(() => [mockGetUserSkillsPoints, { isError: false }]),
  useLazyGetUserDesiredSkillsQuery: vi.fn(() => [mockGetUserDesiredSkills, { isError: false }]),
  useLazyGetPerLearnerInfoQuery: vi.fn(() => [mockGetPerLearnerInfo, { isError: false }]),
}));

const mockGetUserCredentials = vi.fn();
vi.mock('@/services/credentials', () => ({
  useLazyGetUserCredentialsQuery: vi.fn(() => [mockGetUserCredentials, { isError: false }]),
}));

const mockGetUserEnrolledCourses = vi.fn();
vi.mock('@/services/courses', () => ({
  useLazyGetUserEnrolledCoursesQuery: vi.fn(() => [mockGetUserEnrolledCourses, { isError: false }]),
}));

const mockGetUserEnrolledPrograms = vi.fn();
const mockGetUserCatalogPathways = vi.fn();
vi.mock('@/services/catalog', () => ({
  useLazyGetUserEnrolledProgramsQuery: vi.fn(() => [
    mockGetUserEnrolledPrograms,
    { isError: false },
  ]),
  useLazyGetUserCatalogPathwaysQuery: vi.fn(() => [mockGetUserCatalogPathways, { error: null }]),
}));

const mockGetUserPerLearnerInfo = vi.fn();
vi.mock('@/services/perlearner', () => ({
  useLazyGetUserPerLearnerInfoQuery: vi.fn(() => [mockGetUserPerLearnerInfo, { isError: false }]),
}));

import { useProfileActivityStats } from '../use-profile-activity-stats';

describe('useProfileActivityStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserSkillsPoints.mockResolvedValue({ data: null });
    mockGetUserReportedSkills.mockResolvedValue({ data: null });
    mockGetUserDesiredSkills.mockResolvedValue({ data: null });
    mockGetPerLearnerInfo.mockResolvedValue({ data: null });
    mockGetUserCredentials.mockResolvedValue({ data: null });
    mockGetUserEnrolledCourses.mockResolvedValue({ data: null });
    mockGetUserEnrolledPrograms.mockResolvedValue({ data: null });
    mockGetUserCatalogPathways.mockResolvedValue({ data: null });
    mockGetUserPerLearnerInfo.mockResolvedValue({ data: null });
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useProfileActivityStats());
    expect(result.current).toHaveProperty('stats');
    expect(Array.isArray(result.current.stats)).toBe(true);
  });

  it('initializes stats with loading state', () => {
    const { result } = renderHook(() => useProfileActivityStats());
    const stats = result.current.stats;
    expect(stats.length).toBe(9);
    expect(stats.every((s) => s.loading === true)).toBe(true);
    const labels = stats.map((s) => s.label);
    expect(labels).toContain('Points');
    expect(labels).toContain('Skills');
    expect(labels).toContain('Credentials');
    expect(labels).toContain('Courses');
    expect(labels).toContain('Programs');
    expect(labels).toContain('Pathways');
    expect(labels).toContain('Hours');
    expect(labels).toContain('Assessments');
    expect(labels).toContain('Videos');
  });

  it('updates Points stat after fetch', async () => {
    mockGetUserSkillsPoints.mockResolvedValue({
      data: {
        skill_points: {
          python: { total_points: 100 },
          js: { total_points: 50 },
        },
      },
    });

    const { result } = renderHook(() => useProfileActivityStats());

    await waitFor(() => {
      const pointsStat = result.current.stats.find((s) => s.label === 'Points');
      expect(pointsStat?.loading).toBe(false);
      expect(pointsStat?.value).toBe(150);
    });
  });

  it('sets Points to 0 when skill_points is empty', async () => {
    mockGetUserSkillsPoints.mockResolvedValue({ data: { skill_points: {} } });

    const { result } = renderHook(() => useProfileActivityStats());

    await waitFor(() => {
      const pointsStat = result.current.stats.find((s) => s.label === 'Points');
      expect(pointsStat?.loading).toBe(false);
      expect(pointsStat?.value).toBe(0);
    });
  });

  it('updates Skills stat from reported and desired skills', async () => {
    mockGetUserReportedSkills.mockResolvedValue({
      data: { skills: [{ name: 'Python' }, { name: 'JavaScript' }] },
    });
    mockGetUserDesiredSkills.mockResolvedValue({
      data: { skills: [{ name: 'React' }] },
    });

    const { result } = renderHook(() => useProfileActivityStats());

    await waitFor(() => {
      const skillsStat = result.current.stats.find((s) => s.label === 'Skills');
      expect(skillsStat?.loading).toBe(false);
      expect(skillsStat?.value).toBe(3);
    });
  });

  it('updates Credentials stat', async () => {
    mockGetUserCredentials.mockResolvedValue({
      data: { data: [{ id: 'cred-1' }, { id: 'cred-2' }] },
    });

    const { result } = renderHook(() => useProfileActivityStats());

    await waitFor(() => {
      const credsStat = result.current.stats.find((s) => s.label === 'Credentials');
      expect(credsStat?.loading).toBe(false);
      expect(credsStat?.value).toBe(2);
    });
  });

  it('updates Courses stat', async () => {
    mockGetUserEnrolledCourses.mockResolvedValue({
      data: { count: 5 },
    });

    const { result } = renderHook(() => useProfileActivityStats());

    await waitFor(() => {
      const coursesStat = result.current.stats.find((s) => s.label === 'Courses');
      expect(coursesStat?.loading).toBe(false);
      expect(coursesStat?.value).toBe(5);
    });
  });

  it('updates Programs stat', async () => {
    mockGetUserEnrolledPrograms.mockResolvedValue({
      data: [{ id: 'prog-1' }, { id: 'prog-2' }, { id: 'prog-3' }],
    });

    const { result } = renderHook(() => useProfileActivityStats());

    await waitFor(() => {
      const programsStat = result.current.stats.find((s) => s.label === 'Programs');
      expect(programsStat?.loading).toBe(false);
      expect(programsStat?.value).toBe(3);
    });
  });

  it('updates Pathways stat', async () => {
    mockGetUserCatalogPathways.mockResolvedValue({
      data: [
        { id: 'p1', path: [{ id: 'r1' }, { id: 'r2' }] },
        { id: 'p2', path: [{ id: 'r3' }] },
      ],
    });

    const { result } = renderHook(() => useProfileActivityStats());

    await waitFor(() => {
      const pathwaysStat = result.current.stats.find((s) => s.label === 'Pathways');
      expect(pathwaysStat?.loading).toBe(false);
      expect(pathwaysStat?.value).toBe(2);
    });
  });

  it('deduplicates pathways by id', async () => {
    mockGetUserCatalogPathways.mockResolvedValue({
      data: [
        { id: 'p1', path: [{ id: 'r1' }] },
        { id: 'p1', path: [{ id: 'r2' }] }, // duplicate
        { id: 'p2', path: [] },
      ],
    });

    const { result } = renderHook(() => useProfileActivityStats());

    await waitFor(() => {
      const pathwaysStat = result.current.stats.find((s) => s.label === 'Pathways');
      expect(pathwaysStat?.value).toBe(2); // only unique ones
    });
  });

  it('updates Assessments and Videos stats', async () => {
    mockGetPerLearnerInfo.mockResolvedValue({
      data: { data: { total_assessments: 10, total_videos: 5 } },
    });

    const { result } = renderHook(() => useProfileActivityStats());

    await waitFor(() => {
      const assessmentsStat = result.current.stats.find((s) => s.label === 'Assessments');
      const videosStat = result.current.stats.find((s) => s.label === 'Videos');
      expect(assessmentsStat?.loading).toBe(false);
      expect(assessmentsStat?.value).toBe(10);
      expect(videosStat?.loading).toBe(false);
      expect(videosStat?.value).toBe(5);
    });
  });

  it('reports total time spent as a whole-hours number under the "Hours" label', async () => {
    mockGetUserPerLearnerInfo.mockResolvedValue({
      data: {
        data: { total_time_spent: 53_460 }, // 14.85h
      },
    });

    const { result } = renderHook(() => useProfileActivityStats());

    await waitFor(() => {
      const hoursStat = result.current.stats.find((s) => s.label === 'Hours');
      expect(hoursStat?.loading).toBe(false);
      expect(hoursStat?.value).toBe(15);
    });
  });

  it('sets stats to 0 on error responses', async () => {
    mockGetUserSkillsPoints.mockResolvedValue({ data: null });
    mockGetUserReportedSkills.mockResolvedValue({ data: null });
    mockGetUserDesiredSkills.mockResolvedValue({ data: null });

    const { result } = renderHook(() => useProfileActivityStats());

    await waitFor(() => {
      const pointsStat = result.current.stats.find((s) => s.label === 'Points');
      expect(pointsStat?.loading).toBe(false);
      expect(pointsStat?.value).toBe(0);
    });
  });
});
