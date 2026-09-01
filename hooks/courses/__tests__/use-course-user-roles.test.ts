import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Only the RTK Query hook is stubbed — the scope helpers come from the SDK so
// the test exercises the real filtering.
const mockUseGetUserRolesQuery = vi.hoisted(() => vi.fn());
vi.mock('@iblai/iblai-js/data-layer', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useGetUserRolesQuery: (...args: any[]) => mockUseGetUserRolesQuery(...args),
  };
});

const mockGetUserName = vi.hoisted(() => vi.fn<() => string | null>(() => 'jane'));
vi.mock('@/utils/helpers', () => ({
  getUserName: () => mockGetUserName(),
}));

import { useCourseUserRoles } from '../use-course-user-roles';

const COURSE = 'course-v1:Org+CS101+2024';
const OTHER_COURSE = 'course-v1:Org+CS102+2024';

const role = (name: string, course = COURSE) => ({ role: name, org: 'Org', course });

const mockRoles = (data: any, extra: Record<string, unknown> = {}) =>
  mockUseGetUserRolesQuery.mockReturnValue({
    data,
    isSuccess: true,
    isError: false,
    ...extra,
  });

describe('useCourseUserRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserName.mockReturnValue('jane');
    mockRoles([]);
  });

  it('looks the roles up by the signed-in username', () => {
    renderHook(() => useCourseUserRoles(COURSE));
    expect(mockUseGetUserRolesQuery).toHaveBeenCalledWith({ username: 'jane' }, { skip: false });
  });

  it.each(['course-staff', 'course-instructor'])('treats %s as full course staff', (name) => {
    mockRoles([role(name)]);
    const { result } = renderHook(() => useCourseUserRoles(COURSE));
    expect(result.current.isCourseStaff).toBe(true);
    expect(result.current.isCourseLimitedStaff).toBe(false);
    expect(result.current.hasCourseStaffAccess).toBe(true);
  });

  it('treats course-limited-staff as staff access without full staff', () => {
    mockRoles([role('course-limited-staff')]);
    const { result } = renderHook(() => useCourseUserRoles(COURSE));
    expect(result.current.isCourseStaff).toBe(false);
    expect(result.current.isCourseLimitedStaff).toBe(true);
    expect(result.current.hasCourseStaffAccess).toBe(true);
  });

  it('grants no staff access for a non-staff course role', () => {
    mockRoles([role('course-beta-tester')]);
    const { result } = renderHook(() => useCourseUserRoles(COURSE));
    expect(result.current.hasCourseStaffAccess).toBe(false);
    expect(result.current.courseRoles).toHaveLength(1);
  });

  it('ignores staff roles held on a different course', () => {
    mockRoles([role('course-instructor', OTHER_COURSE)]);
    const { result } = renderHook(() => useCourseUserRoles(COURSE));
    expect(result.current.courseRoles).toEqual([]);
    expect(result.current.hasCourseStaffAccess).toBe(false);
  });

  it('ignores global and org roles', () => {
    mockRoles([
      { role: 'staff', org: '', course: '' },
      { role: 'org-instructor', org: 'Org', course: '' },
    ]);
    const { result } = renderHook(() => useCourseUserRoles(COURSE));
    expect(result.current.courseRoles).toEqual([]);
    expect(result.current.hasCourseStaffAccess).toBe(false);
  });

  it('keeps every course role held on this course', () => {
    mockRoles([role('course-staff'), role('course-data-researcher'), role('staff', '')]);
    const { result } = renderHook(() => useCourseUserRoles(COURSE));
    expect(result.current.courseRoles.map((r) => r.role)).toEqual([
      'course-staff',
      'course-data-researcher',
    ]);
  });

  it('skips the query and reports resolved when there is no username', () => {
    mockGetUserName.mockReturnValue(null);
    mockRoles(undefined, { isSuccess: false, isError: false });
    const { result } = renderHook(() => useCourseUserRoles(COURSE));
    expect(mockUseGetUserRolesQuery).toHaveBeenCalledWith({ username: '' }, { skip: true });
    expect(result.current.isResolved).toBe(true);
    expect(result.current.hasCourseStaffAccess).toBe(false);
  });

  it('skips the query when there is no course ID', () => {
    const { result } = renderHook(() => useCourseUserRoles(undefined));
    expect(mockUseGetUserRolesQuery).toHaveBeenCalledWith({ username: 'jane' }, { skip: true });
    expect(result.current.courseRoles).toEqual([]);
  });

  it('reports unresolved while the listing is in flight', () => {
    mockRoles(undefined, { isSuccess: false, isError: false });
    const { result } = renderHook(() => useCourseUserRoles(COURSE));
    expect(result.current.isResolved).toBe(false);
    expect(result.current.hasCourseStaffAccess).toBe(false);
  });

  it('reports resolved when the listing fails', () => {
    mockRoles(undefined, { isSuccess: false, isError: true });
    const { result } = renderHook(() => useCourseUserRoles(COURSE));
    expect(result.current.isResolved).toBe(true);
    expect(result.current.hasCourseStaffAccess).toBe(false);
  });
});
