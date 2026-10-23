/**
 * Shapes of the Open edX course-home APIs behind the native Dates tab
 * (`services/course-home.ts`). The Progress tab reads `CourseProgress` from
 * `types/courses.ts`, which the course layout already loads.
 */

export type CourseDateType =
  | 'course-start-date'
  | 'course-end-date'
  | 'assignment-due-date'
  | 'verified-upgrade-deadline'
  | 'certificate-available-date'
  | 'verification-deadline'
  | 'course-expired-date'
  | 'enrollment-end-date'
  | (string & {});

export interface CourseDateBlock {
  assignment_type: string | null;
  /** `null` for dates that aren't assignments (course start, end, …). */
  complete: boolean | null;
  /** ISO 8601. */
  date: string;
  date_type: CourseDateType;
  description: string;
  learner_has_access: boolean;
  /** Learning-MFE URL of the assignment; empty when it isn't released yet. */
  link: string;
  link_text: string;
  title: string;
  extra_info: string | null;
  /** Usage key of the assignment's first block, when the LMS knows it. */
  first_component_block_id?: string;
}

export interface DatesBannerInfo {
  missed_deadlines: boolean;
  content_type_gating_enabled: boolean;
  missed_gated_content: boolean;
  verified_upgrade_link: string | null;
}

export interface CourseDatesResponse {
  course_date_blocks: CourseDateBlock[];
  dates_banner_info: DatesBannerInfo;
  has_ended: boolean;
  learner_is_full_access: boolean;
  /** IANA zone the learner chose in their account, or `null` for the browser's. */
  user_timezone: string | null;
}

export interface CourseHomeMeta {
  course_id: string;
  is_enrolled: boolean;
  is_self_paced: boolean;
  is_staff: boolean;
  original_user_is_staff?: boolean;
  can_view_certificate?: boolean;
  number?: string;
  org?: string;
  title?: string;
  start?: string | null;
  username?: string;
  user_timezone: string | null;
  verified_mode?: { upgrade_url?: string } | null;
}

export interface ResetDeadlinesResponse {
  message?: string;
  header?: string;
  link?: string | null;
  link_text?: string | null;
}
