import { createApi } from '@reduxjs/toolkit/query/react';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';
import { config } from '@/lib/config';
import type {
  Cohort,
  CohortSettings,
  CohortUsersResult,
  CourseModesResponse,
  CourseRole,
  CourseRoleMember,
  DueDateExtension,
  EnrollmentChangeResponse,
  ForumRole,
  GradeOverrideHistoryEntry,
  GradeOverrideResult,
  GradeOverrideUpdate,
  GradebookPage,
  GradebookQuery,
  GradingInfo,
  InstructorTask,
  ReportDownload,
  StudentProgressUrl,
  SubsectionGradeHistory,
} from '@/types/instructor';

const course = (courseId: string) => encodeURIComponent(courseId);

// The legacy instructor API reads form-encoded bodies; every value is sent as
// a string the way the edX dashboard's own forms do.
const form = (params: Record<string, string | number | boolean | undefined>) => {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) body.set(key, String(value));
  });
  return body;
};

type FormParams = Record<string, string | number | boolean | undefined>;

// Actions this LMS release serves as DRF views: they take the JWT.
const instructorApi = (courseId: string, action: string, params: FormParams = {}) => ({
  url: `/courses/${courseId}/instructor/api/${action}`,
  method: 'POST',
  body: form(params),
  service: SERVICES.LMS,
  isJson: false,
});

// The rest are still legacy Django views (session + CSRF only, no JWT). They
// are reached the way the edX MFEs on other hosts do it: the LMS session
// cookie travels cross-site (SameSite=None, CORS allows credentials) and a
// CSRF token comes from the LMS's own csrf endpoint, fetched once per page.
let csrfToken: Promise<string> | null = null;
export const resetLegacyCsrfToken = () => {
  csrfToken = null;
};
const getCsrfToken = () => {
  csrfToken ??= fetch(`${config.urls.lms()}/csrf/api/v1/token`, { credentials: 'include' })
    .then(async (response) => {
      if (!response.ok) throw new Error('Could not get a CSRF token from the LMS');
      const body = (await response.json()) as { csrfToken?: string };
      if (!body.csrfToken) throw new Error('The LMS returned no CSRF token');
      return body.csrfToken;
    })
    .catch((error: Error) => {
      csrfToken = null;
      throw error;
    });
  return csrfToken;
};

const readErrorMessage = async (response: Response) => {
  const text = await response.text().catch(() => '');
  try {
    const body = JSON.parse(text) as { error?: string; detail?: string; message?: string };
    return body.error || body.detail || body.message || `Request failed (${response.status})`;
  } catch {
    return response.status === 403
      ? 'You need to be signed in to the LMS for this action'
      : `Request failed (${response.status})`;
  }
};

export const legacyInstructorApi = async <T>(
  courseId: string,
  action: string,
  params: FormParams = {},
): Promise<T> => {
  const token = await getCsrfToken();
  const response = await fetch(
    `${config.urls.lms()}/courses/${courseId}/instructor/api/${action}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRFToken': token,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: form(params).toString(),
    },
  );
  if (!response.ok) {
    // A stale token is the usual 403; drop it so the next call fetches afresh.
    if (response.status === 403) resetLegacyCsrfToken();
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as T;
};

export type ReportKind =
  | 'calculate_grades_csv'
  | 'problem_grade_report'
  | 'get_students_features'
  | 'get_anon_ids'
  | 'get_issued_certificates'
  | 'get_problem_responses';

/**
 * Open edX grades / cohorts / enrollment / instructor endpoints behind the
 * native course admin pages. All of them accept the LMS JWT the app already
 * sends; the legacy `instructor/api/*` views take form bodies.
 */
export const InstructorSlice = createApi({
  reducerPath: 'InstructorSlice',
  baseQuery: iblFetchBaseQuery,
  tagTypes: ['Gradebook', 'Cohorts', 'CohortSettings', 'RoleMembers', 'ForumMembers', 'Tasks'],
  endpoints: (builder) => ({
    getGradebook: builder.query<GradebookPage, GradebookQuery>({
      query: ({
        courseId,
        cursor,
        pageSize = 25,
        userContains,
        cohortId,
        enrollmentMode,
        assignment,
        assignmentGradeMin,
        assignmentGradeMax,
        courseGradeMin,
        courseGradeMax,
        includeCourseTeam = false,
      }) => {
        const params = new URLSearchParams({ page_size: String(pageSize) });
        if (cursor) params.set('cursor', cursor);
        if (userContains) params.set('user_contains', userContains);
        if (cohortId) params.set('cohort_id', String(cohortId));
        if (enrollmentMode) params.set('enrollment_mode', enrollmentMode);
        if (assignment) {
          params.set('assignment', assignment);
          if (assignmentGradeMin !== undefined) {
            params.set('assignment_grade_min', String(assignmentGradeMin));
          }
          if (assignmentGradeMax !== undefined) {
            params.set('assignment_grade_max', String(assignmentGradeMax));
          }
        }
        if (courseGradeMin !== undefined) params.set('course_grade_min', String(courseGradeMin));
        if (courseGradeMax !== undefined) params.set('course_grade_max', String(courseGradeMax));
        if (!includeCourseTeam) params.set('excluded_course_roles', 'all');
        return {
          url: `/api/grades/v1/gradebook/${course(courseId)}/?${params.toString()}`,
          service: SERVICES.LMS,
        };
      },
      providesTags: ['Gradebook'],
    }),
    getGradingInfo: builder.query<GradingInfo, { courseId: string }>({
      query: ({ courseId }) => ({
        url: `/api/grades/v1/gradebook/${course(courseId)}/grading-info`,
        service: SERVICES.LMS,
      }),
    }),
    bulkUpdateGrades: builder.mutation<
      GradeOverrideResult[],
      { courseId: string; updates: GradeOverrideUpdate[] }
    >({
      query: ({ courseId, updates }) => ({
        url: `/api/grades/v1/gradebook/${course(courseId)}/bulk-update`,
        method: 'POST',
        body: updates,
        service: SERVICES.LMS,
      }),
      invalidatesTags: ['Gradebook'],
    }),
    getGradeOverrideHistory: builder.query<GradeOverrideHistoryEntry[], { courseId: string }>({
      query: ({ courseId }) => ({
        url: `/api/grades/v1/gradebook/${course(courseId)}/bulk-update`,
        service: SERVICES.LMS,
      }),
      providesTags: ['Gradebook'],
    }),
    getSubsectionGrade: builder.query<SubsectionGradeHistory, { usageId: string; userId: number }>({
      query: ({ usageId, userId }) => ({
        url: `/api/grades/v1/subsection/${encodeURIComponent(usageId)}/?user_id=${userId}`,
        service: SERVICES.LMS,
      }),
      providesTags: ['Gradebook'],
    }),
    getCourseModes: builder.query<CourseModesResponse, { courseId: string }>({
      query: ({ courseId }) => ({
        url: `/api/enrollment/v1/course/${course(courseId)}?include_expired=1`,
        service: SERVICES.LMS,
      }),
    }),

    getCohorts: builder.query<Cohort[], { courseId: string }>({
      query: ({ courseId }) => ({
        url: `/api/cohorts/v1/courses/${course(courseId)}/cohorts/`,
        service: SERVICES.LMS,
      }),
      providesTags: ['Cohorts'],
    }),
    getCohortSettings: builder.query<CohortSettings, { courseId: string }>({
      query: ({ courseId }) => ({
        url: `/api/cohorts/v1/settings/${course(courseId)}`,
        service: SERVICES.LMS,
      }),
      providesTags: ['CohortSettings'],
    }),
    updateCohortSettings: builder.mutation<
      CohortSettings,
      { courseId: string; isCohorted: boolean }
    >({
      query: ({ courseId, isCohorted }) => ({
        url: `/api/cohorts/v1/settings/${course(courseId)}`,
        method: 'PATCH',
        body: { is_cohorted: isCohorted },
        service: SERVICES.LMS,
      }),
      invalidatesTags: ['CohortSettings'],
    }),
    createCohort: builder.mutation<
      Cohort,
      { courseId: string; name: string; assignmentType: 'manual' | 'random' }
    >({
      query: ({ courseId, name, assignmentType }) => ({
        url: `/api/cohorts/v1/courses/${course(courseId)}/cohorts/`,
        method: 'POST',
        body: { name, assignment_type: assignmentType },
        service: SERVICES.LMS,
      }),
      invalidatesTags: ['Cohorts'],
    }),
    updateCohort: builder.mutation<
      Cohort,
      { courseId: string; cohortId: number; name?: string; assignmentType?: 'manual' | 'random' }
    >({
      query: ({ courseId, cohortId, name, assignmentType }) => ({
        url: `/api/cohorts/v1/courses/${course(courseId)}/cohorts/${cohortId}`,
        method: 'PATCH',
        body: {
          ...(name !== undefined ? { name } : {}),
          ...(assignmentType !== undefined ? { assignment_type: assignmentType } : {}),
        },
        service: SERVICES.LMS,
      }),
      invalidatesTags: ['Cohorts'],
    }),
    addCohortUsers: builder.mutation<
      CohortUsersResult,
      { courseId: string; cohortId: number; users: string[] }
    >({
      query: ({ courseId, cohortId, users }) => ({
        url: `/api/cohorts/v1/courses/${course(courseId)}/cohorts/${cohortId}/users/`,
        method: 'POST',
        body: { users },
        service: SERVICES.LMS,
      }),
      invalidatesTags: ['Cohorts'],
    }),
    removeCohortUser: builder.mutation<
      void,
      { courseId: string; cohortId: number; username: string }
    >({
      query: ({ courseId, cohortId, username }) => ({
        url: `/api/cohorts/v1/courses/${course(courseId)}/cohorts/${cohortId}/users/${encodeURIComponent(username)}`,
        method: 'DELETE',
        service: SERVICES.LMS,
      }),
      invalidatesTags: ['Cohorts'],
    }),

    listCourseRoleMembers: builder.query<
      CourseRoleMember[],
      { courseId: string; rolename: CourseRole }
    >({
      query: ({ courseId, rolename }) =>
        instructorApi(courseId, 'list_course_role_members', { rolename }),
      transformResponse: (response: Record<string, unknown>, _meta, { rolename }) =>
        (response[rolename] as CourseRoleMember[] | undefined) ?? [],
      providesTags: (_result, _error, { rolename }) => [{ type: 'RoleMembers', id: rolename }],
    }),
    modifyAccess: builder.mutation<
      Record<string, unknown>,
      { courseId: string; identifier: string; rolename: CourseRole; action: 'allow' | 'revoke' }
    >({
      query: ({ courseId, identifier, rolename, action }) =>
        instructorApi(courseId, 'modify_access', {
          unique_student_identifier: identifier,
          rolename,
          action,
        }),
      invalidatesTags: (_result, _error, { rolename }) => [{ type: 'RoleMembers', id: rolename }],
    }),
    bulkBetaModifyAccess: builder.mutation<
      Record<string, unknown>,
      {
        courseId: string;
        identifiers: string;
        action: 'add' | 'remove';
        emailStudents: boolean;
        autoEnroll: boolean;
      }
    >({
      queryFn: async ({ courseId, identifiers, action, emailStudents, autoEnroll }) => ({
        data: await legacyInstructorApi<Record<string, unknown>>(
          courseId,
          'bulk_beta_modify_access',
          { identifiers, action, email_students: emailStudents, auto_enroll: autoEnroll },
        ),
      }),
      invalidatesTags: [{ type: 'RoleMembers', id: 'beta' }],
    }),
    listForumMembers: builder.query<CourseRoleMember[], { courseId: string; rolename: ForumRole }>({
      queryFn: async ({ courseId, rolename }) => {
        const response = await legacyInstructorApi<Record<string, unknown>>(
          courseId,
          'list_forum_members',
          { rolename },
        );
        return { data: (response[rolename] as CourseRoleMember[] | undefined) ?? [] };
      },
      providesTags: (_result, _error, { rolename }) => [{ type: 'ForumMembers', id: rolename }],
    }),
    updateForumRoleMembership: builder.mutation<
      Record<string, unknown>,
      { courseId: string; identifier: string; rolename: ForumRole; action: 'allow' | 'revoke' }
    >({
      queryFn: async ({ courseId, identifier, rolename, action }) => ({
        data: await legacyInstructorApi<Record<string, unknown>>(
          courseId,
          'update_forum_role_membership',
          { unique_student_identifier: identifier, rolename, action },
        ),
      }),
      invalidatesTags: (_result, _error, { rolename }) => [{ type: 'ForumMembers', id: rolename }],
    }),
    updateEnrollment: builder.mutation<
      EnrollmentChangeResponse,
      {
        courseId: string;
        identifiers: string;
        action: 'enroll' | 'unenroll';
        autoEnroll: boolean;
        emailStudents: boolean;
      }
    >({
      queryFn: async ({ courseId, identifiers, action, autoEnroll, emailStudents }) => ({
        data: await legacyInstructorApi<EnrollmentChangeResponse>(
          courseId,
          'students_update_enrollment',
          { identifiers, action, auto_enroll: autoEnroll, email_students: emailStudents },
        ),
      }),
      invalidatesTags: ['Gradebook'],
    }),

    listInstructorTasks: builder.query<InstructorTask[], { courseId: string }>({
      query: ({ courseId }) => instructorApi(courseId, 'list_instructor_tasks'),
      transformResponse: (response: { tasks?: InstructorTask[] }) => response.tasks ?? [],
      providesTags: ['Tasks'],
    }),
    listReportDownloads: builder.query<ReportDownload[], { courseId: string }>({
      query: ({ courseId }) => instructorApi(courseId, 'list_report_downloads'),
      transformResponse: (response: { downloads?: ReportDownload[] }) => response.downloads ?? [],
      providesTags: ['Tasks'],
    }),
    generateReport: builder.mutation<
      { status?: string },
      { courseId: string; report: ReportKind; problemLocation?: string }
    >({
      // get_students_features and get_anon_ids are DRF (JWT); the other reports
      // are legacy views. get_issued_certificates insists on a trailing slash.
      queryFn: async ({ courseId, report, problemLocation }, api, extraOptions) => {
        const params: FormParams = {
          ...(report === 'get_students_features' ? { csv: 'true' } : {}),
          ...(problemLocation ? { problem_location: problemLocation } : {}),
        };
        if (report === 'get_students_features' || report === 'get_anon_ids') {
          const result = await iblFetchBaseQuery(
            instructorApi(courseId, report, params),
            api,
            extraOptions,
          );
          return result.error
            ? { error: result.error }
            : { data: result.data as { status?: string } };
        }
        const action = report === 'get_issued_certificates' ? `${report}/` : report;
        return { data: await legacyInstructorApi<{ status?: string }>(courseId, action, params) };
      },
      invalidatesTags: ['Tasks'],
    }),

    getStudentProgressUrl: builder.query<
      StudentProgressUrl,
      { courseId: string; identifier: string }
    >({
      query: ({ courseId, identifier }) =>
        instructorApi(courseId, 'get_student_progress_url', {
          unique_student_identifier: identifier,
        }),
    }),
    resetStudentAttempts: builder.mutation<
      Record<string, unknown>,
      {
        courseId: string;
        problemLocation: string;
        identifier?: string;
        allStudents?: boolean;
        deleteModule?: boolean;
      }
    >({
      query: ({ courseId, problemLocation, identifier, allStudents, deleteModule }) =>
        instructorApi(courseId, 'reset_student_attempts', {
          problem_to_reset: problemLocation,
          unique_student_identifier: identifier,
          all_students: allStudents,
          delete_module: deleteModule,
        }),
      invalidatesTags: ['Tasks'],
    }),
    rescoreProblem: builder.mutation<
      Record<string, unknown>,
      {
        courseId: string;
        problemLocation: string;
        identifier?: string;
        allStudents?: boolean;
        onlyIfHigher?: boolean;
      }
    >({
      queryFn: async ({ courseId, problemLocation, identifier, allStudents, onlyIfHigher }) => ({
        data: await legacyInstructorApi<Record<string, unknown>>(courseId, 'rescore_problem', {
          problem_to_reset: problemLocation,
          unique_student_identifier: identifier,
          all_students: allStudents,
          only_if_higher: onlyIfHigher,
        }),
      }),
      invalidatesTags: ['Tasks'],
    }),
    overrideProblemScore: builder.mutation<
      Record<string, unknown>,
      { courseId: string; problemLocation: string; identifier: string; score: number }
    >({
      queryFn: async ({ courseId, problemLocation, identifier, score }) => ({
        data: await legacyInstructorApi<Record<string, unknown>>(
          courseId,
          'override_problem_score',
          {
            problem_to_reset: problemLocation,
            unique_student_identifier: identifier,
            score,
          },
        ),
      }),
      invalidatesTags: ['Tasks', 'Gradebook'],
    }),

    showStudentExtensions: builder.query<
      DueDateExtension,
      { courseId: string; identifier: string }
    >({
      query: ({ courseId, identifier }) =>
        instructorApi(courseId, 'show_student_extensions', { student: identifier }),
    }),
    showUnitExtensions: builder.query<DueDateExtension, { courseId: string; unitLocation: string }>(
      {
        queryFn: async ({ courseId, unitLocation }) => ({
          data: await legacyInstructorApi<DueDateExtension>(courseId, 'show_unit_extensions', {
            url: unitLocation,
          }),
        }),
      },
    ),
    changeDueDate: builder.mutation<
      Record<string, unknown>,
      { courseId: string; identifier: string; unitLocation: string; dueDatetime: string }
    >({
      query: ({ courseId, identifier, unitLocation, dueDatetime }) =>
        instructorApi(courseId, 'change_due_date', {
          student: identifier,
          url: unitLocation,
          due_datetime: dueDatetime,
        }),
    }),
    resetDueDate: builder.mutation<
      Record<string, unknown>,
      { courseId: string; identifier: string; unitLocation: string }
    >({
      query: ({ courseId, identifier, unitLocation }) =>
        instructorApi(courseId, 'reset_due_date', { student: identifier, url: unitLocation }),
    }),
  }),
});

export const {
  useGetGradebookQuery,
  useLazyGetGradebookQuery,
  useGetGradingInfoQuery,
  useBulkUpdateGradesMutation,
  useGetGradeOverrideHistoryQuery,
  useGetSubsectionGradeQuery,
  useGetCourseModesQuery,
  useGetCohortsQuery,
  useGetCohortSettingsQuery,
  useUpdateCohortSettingsMutation,
  useCreateCohortMutation,
  useUpdateCohortMutation,
  useAddCohortUsersMutation,
  useRemoveCohortUserMutation,
  useListCourseRoleMembersQuery,
  useModifyAccessMutation,
  useBulkBetaModifyAccessMutation,
  useListForumMembersQuery,
  useUpdateForumRoleMembershipMutation,
  useUpdateEnrollmentMutation,
  useListInstructorTasksQuery,
  useListReportDownloadsQuery,
  useGenerateReportMutation,
  useLazyGetStudentProgressUrlQuery,
  useResetStudentAttemptsMutation,
  useRescoreProblemMutation,
  useOverrideProblemScoreMutation,
  useLazyShowStudentExtensionsQuery,
  useLazyShowUnitExtensionsQuery,
  useChangeDueDateMutation,
  useResetDueDateMutation,
} = InstructorSlice;
