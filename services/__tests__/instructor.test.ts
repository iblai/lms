import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

// Capture the args each JWT endpoint builds instead of hitting fetch (jsdom's
// AbortSignal is rejected by undici's Request constructor on Node 25).
type Captured = { url: string; method: string; body?: unknown; isJson?: boolean; service?: string };
let captured: Captured[] = [];
let nextResponse: unknown = { ok: true };
vi.mock('@/lib/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...original,
    iblFetchBaseQuery: async (args: any) => {
      captured.push({
        url: args.url,
        method: (args.method ?? 'GET').toUpperCase(),
        body: args.body,
        isJson: args.isJson,
        service: args.service,
      });
      return { data: nextResponse };
    },
  };
});
vi.mock('@/lib/config', () => ({ config: { urls: { lms: () => 'https://lms.example.org' } } }));

// The legacy (session + CSRF) transport talks to fetch directly.
type FetchCall = { url: string; init: RequestInit };
let fetchCalls: FetchCall[] = [];
let csrfResponse: () => Response = () =>
  new Response(JSON.stringify({ csrfToken: 'tok-1' }), { status: 200 });
let legacyResponse: () => Response = () =>
  new Response(JSON.stringify({ ok: true }), { status: 200 });
vi.stubGlobal(
  'fetch',
  vi.fn(async (url: string, init: RequestInit = {}) => {
    fetchCalls.push({ url, init });
    return url.endsWith('/csrf/api/v1/token') ? csrfResponse() : legacyResponse();
  }),
);

import { InstructorSlice, legacyInstructorApi, resetLegacyCsrfToken } from '../instructor';

const COURSE = 'course-v1:org+c+run';
const ENC = encodeURIComponent(COURSE);
const LEGACY = `https://lms.example.org/courses/${COURSE}/instructor/api`;

const makeStore = () =>
  configureStore({
    reducer: { [InstructorSlice.reducerPath]: InstructorSlice.reducer },
    middleware: (getDefault) => getDefault().concat(InstructorSlice.middleware),
  });

const formOf = (body: unknown) => Object.fromEntries(body as URLSearchParams);
const csrfCalls = () => fetchCalls.filter((c) => c.url.endsWith('/csrf/api/v1/token'));
/** The last legacy (fetch) call: URL, decoded form body and request init. */
const lastLegacy = () => {
  const call = fetchCalls.filter((c) => !c.url.endsWith('/csrf/api/v1/token')).at(-1)!;
  return {
    url: call.url,
    body: Object.fromEntries(new URLSearchParams(String(call.init.body))),
    init: call.init,
    headers: call.init.headers as Record<string, string>,
  };
};

describe('InstructorSlice', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    captured = [];
    fetchCalls = [];
    nextResponse = { ok: true };
    csrfResponse = () => new Response(JSON.stringify({ csrfToken: 'tok-1' }), { status: 200 });
    legacyResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });
    resetLegacyCsrfToken();
    store = makeStore();
  });

  // `forceRefetch` sidesteps the query cache for repeated args; the call read
  // back is the first one this dispatch made, so tag-invalidation refetches
  // triggered by a mutation don't get mistaken for the mutation itself.
  const run = async (endpoint: string, args: unknown) => {
    const before = captured.length;
    const result = await store.dispatch(
      (InstructorSlice.endpoints as any)[endpoint].initiate(args, { forceRefetch: true }),
    );
    return { result, call: captured[before] };
  };

  it('builds the gradebook list URL from every filter', async () => {
    const { call } = await run('getGradebook', {
      courseId: COURSE,
      cursor: 'abc',
      pageSize: 10,
      userContains: 'ada',
      cohortId: 3,
      enrollmentMode: 'audit',
      assignment: 'block-v1:x+type@sequential+block@hw1',
      assignmentGradeMin: 20,
      assignmentGradeMax: 80,
      courseGradeMin: 10,
      courseGradeMax: 90,
      includeCourseTeam: true,
    });
    const url = new URL(`https://lms${call.url}`);
    expect(url.pathname).toBe(`/api/grades/v1/gradebook/${ENC}/`);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page_size: '10',
      cursor: 'abc',
      user_contains: 'ada',
      cohort_id: '3',
      enrollment_mode: 'audit',
      assignment: 'block-v1:x+type@sequential+block@hw1',
      assignment_grade_min: '20',
      assignment_grade_max: '80',
      course_grade_min: '10',
      course_grade_max: '90',
    });
    expect(call.service).toBe('LMS');
  });

  it('defaults the gradebook page size, leaves the course team out and omits empty filters', async () => {
    const { call } = await run('getGradebook', { courseId: COURSE });
    expect(call.url).toBe(
      `/api/grades/v1/gradebook/${ENC}/?page_size=25&excluded_course_roles=all`,
    );
  });

  it('only sends assignment grade bounds together with an assignment', async () => {
    const { call } = await run('getGradebook', {
      courseId: COURSE,
      assignmentGradeMin: 20,
      assignmentGradeMax: 80,
      includeCourseTeam: true,
    });
    expect(call.url).toBe(`/api/grades/v1/gradebook/${ENC}/?page_size=25`);
  });

  it('reads grading info, override history, a subsection grade and course modes', async () => {
    expect((await run('getGradingInfo', { courseId: COURSE })).call.url).toBe(
      `/api/grades/v1/gradebook/${ENC}/grading-info`,
    );
    expect((await run('getGradeOverrideHistory', { courseId: COURSE })).call).toMatchObject({
      url: `/api/grades/v1/gradebook/${ENC}/bulk-update`,
      method: 'GET',
    });
    expect(
      (
        await run('getSubsectionGrade', {
          usageId: 'block-v1:x+type@sequential+block@1',
          userId: 7,
        })
      ).call.url,
    ).toBe('/api/grades/v1/subsection/block-v1%3Ax%2Btype%40sequential%2Bblock%401/?user_id=7');
    expect((await run('getCourseModes', { courseId: COURSE })).call.url).toBe(
      `/api/enrollment/v1/course/${ENC}?include_expired=1`,
    );
  });

  it('posts grade overrides as JSON', async () => {
    const updates = [{ user_id: 7, usage_id: 'u', grade: { earned_graded_override: 4 } }];
    const { call } = await run('bulkUpdateGrades', { courseId: COURSE, updates });
    expect(call).toMatchObject({
      url: `/api/grades/v1/gradebook/${ENC}/bulk-update`,
      method: 'POST',
      body: updates,
    });
  });

  it('covers the cohorts API: settings, create, update, add and remove users', async () => {
    expect((await run('getCohorts', { courseId: COURSE })).call.url).toBe(
      `/api/cohorts/v1/courses/${ENC}/cohorts/`,
    );
    expect((await run('getCohortSettings', { courseId: COURSE })).call.url).toBe(
      `/api/cohorts/v1/settings/${ENC}`,
    );
    expect(
      (await run('updateCohortSettings', { courseId: COURSE, isCohorted: true })).call,
    ).toMatchObject({ method: 'PATCH', body: { is_cohorted: true } });
    expect(
      (await run('createCohort', { courseId: COURSE, name: 'A', assignmentType: 'random' })).call,
    ).toMatchObject({ method: 'POST', body: { name: 'A', assignment_type: 'random' } });
    expect(
      (await run('updateCohort', { courseId: COURSE, cohortId: 4, name: 'B' })).call,
    ).toMatchObject({
      url: `/api/cohorts/v1/courses/${ENC}/cohorts/4`,
      method: 'PATCH',
      body: { name: 'B' },
    });
    expect(
      (await run('updateCohort', { courseId: COURSE, cohortId: 4, assignmentType: 'manual' })).call
        .body,
    ).toEqual({ assignment_type: 'manual' });
    expect(
      (await run('addCohortUsers', { courseId: COURSE, cohortId: 4, users: ['ada', 'bob'] })).call,
    ).toMatchObject({
      url: `/api/cohorts/v1/courses/${ENC}/cohorts/4/users/`,
      method: 'POST',
      body: { users: ['ada', 'bob'] },
    });
    expect(
      (await run('removeCohortUser', { courseId: COURSE, cohortId: 4, username: 'a b' })).call,
    ).toMatchObject({
      url: `/api/cohorts/v1/courses/${ENC}/cohorts/4/users/a%20b`,
      method: 'DELETE',
    });
  });

  it('posts form bodies to the DRF instructor views and unwraps role listings', async () => {
    nextResponse = { course_id: COURSE, staff: [{ username: 'ada' }] };
    const { result, call } = await run('listCourseRoleMembers', {
      courseId: COURSE,
      rolename: 'staff',
    });
    expect(call).toMatchObject({
      url: `/courses/${COURSE}/instructor/api/list_course_role_members`,
      method: 'POST',
      isJson: false,
    });
    expect(formOf(call.body)).toEqual({ rolename: 'staff' });
    expect(result.data).toEqual([{ username: 'ada' }]);

    nextResponse = { course_id: COURSE };
    expect(
      (await run('listCourseRoleMembers', { courseId: COURSE, rolename: 'beta' })).result.data,
    ).toEqual([]);

    expect(
      formOf(
        (
          await run('modifyAccess', {
            courseId: COURSE,
            identifier: 'ada@x.org',
            rolename: 'staff',
            action: 'allow',
          })
        ).call.body,
      ),
    ).toEqual({ unique_student_identifier: 'ada@x.org', rolename: 'staff', action: 'allow' });
  });

  it('reads forum members through the session transport, unwrapping the role key', async () => {
    legacyResponse = () =>
      new Response(JSON.stringify({ Moderator: [{ username: 'mod' }] }), { status: 200 });
    expect(
      (await run('listForumMembers', { courseId: COURSE, rolename: 'Moderator' })).result.data,
    ).toEqual([{ username: 'mod' }]);
    const call = lastLegacy();
    expect(call.url).toBe(`${LEGACY}/list_forum_members`);
    expect(call.body).toEqual({ rolename: 'Moderator' });
    expect(call.init).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(call.headers['X-CSRFToken']).toBe('tok-1');

    legacyResponse = () => new Response(JSON.stringify({}), { status: 200 });
    expect(
      (await run('listForumMembers', { courseId: COURSE, rolename: 'Administrator' })).result.data,
    ).toEqual([]);
    // The CSRF token is fetched once and reused.
    expect(csrfCalls()).toHaveLength(1);
    expect(captured).toHaveLength(0);
  });

  it('sends the session-only membership mutations the way the dashboard forms do', async () => {
    await run('bulkBetaModifyAccess', {
      courseId: COURSE,
      identifiers: 'a, b',
      action: 'add',
      emailStudents: false,
      autoEnroll: true,
    });
    expect(lastLegacy()).toMatchObject({
      url: `${LEGACY}/bulk_beta_modify_access`,
      body: { identifiers: 'a, b', action: 'add', email_students: 'false', auto_enroll: 'true' },
    });
    await run('updateForumRoleMembership', {
      courseId: COURSE,
      identifier: 'ada',
      rolename: 'Moderator',
      action: 'revoke',
    });
    expect(lastLegacy()).toMatchObject({
      url: `${LEGACY}/update_forum_role_membership`,
      body: { unique_student_identifier: 'ada', rolename: 'Moderator', action: 'revoke' },
    });
    await run('updateEnrollment', {
      courseId: COURSE,
      identifiers: 'ada@x.org',
      action: 'enroll',
      autoEnroll: true,
      emailStudents: true,
    });
    expect(lastLegacy()).toMatchObject({
      url: `${LEGACY}/students_update_enrollment`,
      body: {
        identifiers: 'ada@x.org',
        action: 'enroll',
        auto_enroll: 'true',
        email_students: 'true',
      },
    });
    expect(captured).toHaveLength(0);
  });

  it('lists tasks and downloads, tolerating empty payloads', async () => {
    nextResponse = { tasks: [{ task_id: 't1' }] };
    expect((await run('listInstructorTasks', { courseId: COURSE })).result.data).toEqual([
      { task_id: 't1' },
    ]);
    nextResponse = {};
    expect((await run('listInstructorTasks', { courseId: COURSE })).result.data).toEqual([]);
    nextResponse = { downloads: [{ name: 'r.csv' }] };
    expect((await run('listReportDownloads', { courseId: COURSE })).result.data).toEqual([
      { name: 'r.csv' },
    ]);
    nextResponse = {};
    expect((await run('listReportDownloads', { courseId: COURSE })).result.data).toEqual([]);
  });

  it('generates reports over the right transport, with the params each kind needs', async () => {
    // DRF (JWT) reports.
    const profile = await run('generateReport', {
      courseId: COURSE,
      report: 'get_students_features',
    });
    expect(profile.call.url).toBe(`/courses/${COURSE}/instructor/api/get_students_features`);
    expect(formOf(profile.call.body)).toEqual({ csv: 'true' });
    const anon = await run('generateReport', { courseId: COURSE, report: 'get_anon_ids' });
    expect(formOf(anon.call.body)).toEqual({});
    expect(anon.result.data).toEqual({ ok: true });

    // Legacy (session + CSRF) reports.
    const jwtCalls = captured.length;
    await run('generateReport', { courseId: COURSE, report: 'calculate_grades_csv' });
    expect(lastLegacy()).toMatchObject({ url: `${LEGACY}/calculate_grades_csv`, body: {} });
    await run('generateReport', {
      courseId: COURSE,
      report: 'get_problem_responses',
      problemLocation: 'block-v1:p',
    });
    expect(lastLegacy().body).toEqual({ problem_location: 'block-v1:p' });
    await run('generateReport', { courseId: COURSE, report: 'get_issued_certificates' });
    expect(lastLegacy().url).toBe(`${LEGACY}/get_issued_certificates/`);
    expect(captured.length).toBe(jwtCalls);
  });

  it('encodes attempt and score actions, dropping unset flags', async () => {
    expect(
      formOf(
        (await run('getStudentProgressUrl', { courseId: COURSE, identifier: 'ada' })).call.body,
      ),
    ).toEqual({ unique_student_identifier: 'ada' });
    expect(
      formOf(
        (
          await run('resetStudentAttempts', {
            courseId: COURSE,
            problemLocation: 'p',
            identifier: 'ada',
            deleteModule: true,
          })
        ).call.body,
      ),
    ).toEqual({ problem_to_reset: 'p', unique_student_identifier: 'ada', delete_module: 'true' });

    await run('rescoreProblem', { courseId: COURSE, problemLocation: 'p', allStudents: true });
    expect(lastLegacy()).toMatchObject({
      url: `${LEGACY}/rescore_problem`,
      body: { problem_to_reset: 'p', all_students: 'true' },
    });
    await run('overrideProblemScore', {
      courseId: COURSE,
      problemLocation: 'p',
      identifier: 'ada',
      score: 3,
    });
    expect(lastLegacy()).toMatchObject({
      url: `${LEGACY}/override_problem_score`,
      body: { problem_to_reset: 'p', unique_student_identifier: 'ada', score: '3' },
    });
  });

  it('encodes due-date extension calls', async () => {
    expect(
      formOf(
        (await run('showStudentExtensions', { courseId: COURSE, identifier: 'ada' })).call.body,
      ),
    ).toEqual({ student: 'ada' });
    await run('showUnitExtensions', { courseId: COURSE, unitLocation: 'u' });
    expect(lastLegacy()).toMatchObject({
      url: `${LEGACY}/show_unit_extensions`,
      body: { url: 'u' },
    });
    expect(
      formOf(
        (
          await run('changeDueDate', {
            courseId: COURSE,
            identifier: 'ada',
            unitLocation: 'u',
            dueDatetime: '2026-01-01 10:00',
          })
        ).call.body,
      ),
    ).toEqual({ student: 'ada', url: 'u', due_datetime: '2026-01-01 10:00' });
    expect(
      formOf(
        (await run('resetDueDate', { courseId: COURSE, identifier: 'ada', unitLocation: 'u' })).call
          .body,
      ),
    ).toEqual({ student: 'ada', url: 'u' });
  });

  describe('legacy transport', () => {
    it('reports the LMS error message, drops the token on 403 and refetches it', async () => {
      legacyResponse = () => new Response(JSON.stringify({ error: 'Nope' }), { status: 400 });
      await expect(legacyInstructorApi(COURSE, 'rescore_problem')).rejects.toThrow('Nope');

      legacyResponse = () => new Response('<html>forbidden</html>', { status: 403 });
      await expect(legacyInstructorApi(COURSE, 'rescore_problem')).rejects.toThrow(
        'You need to be signed in to the LMS for this action',
      );
      legacyResponse = () => new Response('oops', { status: 500 });
      await expect(legacyInstructorApi(COURSE, 'rescore_problem')).rejects.toThrow(
        'Request failed (500)',
      );
      legacyResponse = () => new Response(JSON.stringify({ detail: 'Detail' }), { status: 404 });
      await expect(legacyInstructorApi(COURSE, 'rescore_problem')).rejects.toThrow('Detail');
      legacyResponse = () => new Response(JSON.stringify({}), { status: 404 });
      await expect(legacyInstructorApi(COURSE, 'rescore_problem')).rejects.toThrow(
        'Request failed (404)',
      );
      // Fetched once at the start, then once more after the 403 cleared it.
      expect(csrfCalls()).toHaveLength(2);
    });

    it('fails clearly when the CSRF token cannot be obtained, and retries next time', async () => {
      csrfResponse = () => new Response('', { status: 500 });
      await expect(legacyInstructorApi(COURSE, 'rescore_problem')).rejects.toThrow(
        'Could not get a CSRF token from the LMS',
      );
      csrfResponse = () => new Response(JSON.stringify({}), { status: 200 });
      await expect(legacyInstructorApi(COURSE, 'rescore_problem')).rejects.toThrow(
        'The LMS returned no CSRF token',
      );
      csrfResponse = () => new Response(JSON.stringify({ csrfToken: 'tok-2' }), { status: 200 });
      legacyResponse = () => new Response(JSON.stringify({ fine: true }), { status: 200 });
      await expect(legacyInstructorApi(COURSE, 'rescore_problem')).resolves.toEqual({
        fine: true,
      });
      expect(lastLegacy().headers['X-CSRFToken']).toBe('tok-2');
    });
  });
});
