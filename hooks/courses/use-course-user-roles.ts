import { useMemo } from 'react';

import { filterCourseUserRoles, useGetUserRolesQuery } from '@iblai/iblai-js/data-layer';
import type { UserRole, UserRoleKey } from '@iblai/iblai-js/data-layer';
import { getUserName } from '@/utils/helpers';

/**
 * Course-scoped roles granting full staff access to a course run — every
 * staff tab, authoring included.
 */
export const COURSE_STAFF_ROLES: UserRoleKey[] = ['course-staff', 'course-instructor'];

/**
 * Course-scoped role granting staff access to everything *except* authoring:
 * limited staff can run the course but not edit it in Studio.
 */
export const COURSE_LIMITED_STAFF_ROLE: UserRoleKey = 'course-limited-staff';

export interface CourseUserRoles {
  /** Every role the current user holds on this specific course run. */
  courseRoles: UserRole[];
  /** Holds `course-staff` or `course-instructor` on this course. */
  isCourseStaff: boolean;
  /** Holds `course-limited-staff` on this course. */
  isCourseLimitedStaff: boolean;
  /** Holds any of the three staff roles — the gate for the staff-only tabs. */
  hasCourseStaffAccess: boolean;
  /** The role listing has come back (or failed) — nothing more is pending. */
  isResolved: boolean;
}

/**
 * Course-scoped role flags for the signed-in user, read off the platform-wide
 * role listing (`GET /api/ibl/users/manage/roles/`) and narrowed to one course
 * run. Skipped entirely when we have neither a username nor a course ID.
 */
export function useCourseUserRoles(courseId: string | undefined): CourseUserRoles {
  const username = getUserName();
  const { data, isSuccess, isError } = useGetUserRolesQuery(
    { username: username ?? '' },
    { skip: !username || !courseId },
  );

  return useMemo(() => {
    const courseRoles = courseId ? filterCourseUserRoles(data ?? [], courseId) : [];
    const roleKeys = courseRoles.map((role) => role.role);
    const isCourseStaff = roleKeys.some((role) => COURSE_STAFF_ROLES.includes(role));
    const isCourseLimitedStaff = roleKeys.includes(COURSE_LIMITED_STAFF_ROLE);

    return {
      courseRoles,
      isCourseStaff,
      isCourseLimitedStaff,
      hasCourseStaffAccess: isCourseStaff || isCourseLimitedStaff,
      // No username / course ID means the query never ran; treat that as
      // settled so consumers don't wait on a request that will never fire.
      isResolved: isSuccess || isError || !username || !courseId,
    };
  }, [data, courseId, isSuccess, isError, username]);
}
