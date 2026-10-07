/**
 * Shapes of the Open edX grades, cohorts, enrollment and instructor APIs the
 * native course admin pages consume (`services/instructor.ts`).
 */

export interface GradebookSubsectionGrade {
  module_id: string;
  subsection_name: string;
  label?: string;
  category?: string;
  score_earned: number;
  score_possible: number;
  percent: number;
  attempted?: boolean;
  are_grades_published?: boolean;
  is_graded?: boolean;
}

export interface GradebookRow {
  user_id: number;
  username: string;
  email: string;
  full_name?: string;
  external_user_key?: string | null;
  percent: number;
  letter_grade?: string | null;
  progress_page_url?: string;
  section_breakdown: GradebookSubsectionGrade[];
}

export interface GradebookPage {
  next: string | null;
  previous: string | null;
  results: GradebookRow[];
  total_users_count: number;
  filtered_users_count: number;
}

export interface GradebookQuery {
  courseId: string;
  cursor?: string;
  pageSize?: number;
  userContains?: string;
  cohortId?: number | string;
  enrollmentMode?: string;
  /** Usage key of one graded subsection; the assignment grade bounds apply to it. */
  assignment?: string;
  assignmentGradeMin?: number;
  assignmentGradeMax?: number;
  courseGradeMin?: number;
  courseGradeMax?: number;
  /** Course staff are left out unless asked for, as in the edX gradebook. */
  includeCourseTeam?: boolean;
}

export interface GradingAssignmentType {
  type: string;
  short_label: string;
  min_count: number;
  drop_count: number;
  weight: number;
}

export interface GradingSubsection {
  module_id: string;
  display_name: string;
  assignment_type: string | null;
  short_label: string | null;
  graded: boolean;
}

export interface GradingInfo {
  grade_cutoffs: Record<string, number>;
  assignment_types: Record<string, GradingAssignmentType>;
  subsections: GradingSubsection[];
  grades_frozen: boolean;
  can_see_bulk_management: boolean;
}

export interface GradeOverrideUpdate {
  user_id: number;
  usage_id: string;
  grade: {
    earned_graded_override: number;
    possible_graded_override?: number;
    comment?: string;
  };
}

export interface GradeOverrideResult {
  user_id: number;
  usage_id: string;
  success: boolean;
  reason: string | null;
}

export interface GradeOverrideHistoryEntry {
  user_id: number;
  usage_id: string;
  comments?: string;
  created?: string;
  modified?: string;
  grade_override_earned?: number;
  grade_override_possible?: number;
  history?: unknown;
}

export interface SubsectionGradeHistory {
  original_grade?: { earned_graded: number; possible_graded: number } | null;
  override?: { earned_graded_override: number; possible_graded_override: number } | null;
  history?: Array<{
    created: string;
    comments?: string;
    earned_graded_override?: number;
    possible_graded_override?: number;
    feature?: string;
    user?: { username?: string } | string;
  }>;
  subsection_id?: string;
  user_id?: number;
}

export interface CourseMode {
  slug: string;
  name: string;
}

export interface CourseModesResponse {
  course_id: string;
  course_modes: CourseMode[];
}

export interface Cohort {
  id: number;
  name: string;
  assignment_type: 'manual' | 'random';
  user_count: number;
  group_id?: number | null;
  user_partition_id?: number | null;
}

export interface CohortSettings {
  id: number;
  is_cohorted: boolean;
}

export interface CohortUsersResult {
  success?: boolean;
  added?: string[];
  changed?: string[];
  present?: string[];
  unknown?: string[];
  preassigned?: string[];
  invalid?: string[];
}

export interface CourseRoleMember {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export type CourseRole = 'staff' | 'instructor' | 'beta' | 'data_researcher' | 'ccx_coach';
export type ForumRole = 'Administrator' | 'Moderator' | 'Group Moderator' | 'Community TA';

export interface EnrollmentState {
  user: boolean;
  enrollment: boolean;
  allowed: boolean;
  auto_enroll: boolean;
}

export interface EnrollmentChangeResult {
  identifier: string;
  before: EnrollmentState;
  after: EnrollmentState;
  error?: boolean;
  invalidIdentifier?: boolean;
}

export interface EnrollmentChangeResponse {
  action: 'enroll' | 'unenroll';
  results: EnrollmentChangeResult[];
  auto_enroll: boolean;
}

export interface InstructorTask {
  task_id: string;
  task_type: string;
  task_input: string;
  task_state: string;
  requester: string;
  created: string;
  status: string;
  task_message: string;
  duration_sec?: number | string;
}

export interface ReportDownload {
  name: string;
  url: string;
  link: string;
}

export interface DueDateExtension {
  header: string[];
  title: string;
  data: Array<Record<string, string>>;
}

export interface StudentProgressUrl {
  course_id: string;
  progress_url: string;
}
