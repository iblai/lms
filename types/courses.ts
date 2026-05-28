export interface CourseCustom {
  course_vLab: boolean | null;
  course_order: number | null;
  course_licensed: boolean | null;
  course_assessment: boolean | null;
  course_nasba_CPEs: number | null;
  course_external_id: string | null;
  course_practice_exam: boolean | null;
  course_prerequisites: Array<{
    prerequisiteSlug: string;
    prerequisiteTitle: string;
    prerequisiteExternalId: string;
  }> | null;
  course_target_audience: string | null;
  course_learning_options: string[] | null;
}

export interface CourseData {
  tags: string[] | null;
  level: string | null;
  custom: CourseCustom | null;
  topics: string[];
  subject: string | null;
  industry: string | null;
  job_role: string | null;
  promotion: string | null;
  credential: string | null;
  social_team: string | null;
  usage_limit: string | null;
  audit_allowed: string | null;
  social_channels: string | null;
  certificate_type: string | null;
  certificate?: boolean;
}

export interface InstructorInfo {
  instructors: Instructor[];
}

export interface Instructor {
  name: string;
  bio: string;
  organization: string;
  title: string;
  image: string;
}

export interface CourseEdxData {
  title: string;
  effort: string | null;
  license: string | null;
  duration: string;
  end_date: string | null;
  language: string;
  overview: string;
  subtitle: string;
  syllabus: string | null;
  self_paced: boolean;
  start_date: string;
  description: string;
  intro_video: string | null;
  learning_info: string[];
  enrollment_end: string | null;
  instructor_info: InstructorInfo;
  enrollment_start: string | null;
  entrance_exam_id: string;
  banner_image_name: string;
  course_image_name: string;
  short_description: string;
  about_sidebar_html: string;
  entrance_exam_enabled: string;
  pre_requisite_courses: string[];
  banner_image_asset_path: string;
  course_image_asset_path: string;
  certificate_available_date: string | null;
  video_thumbnail_image_name: string;
  certificates_display_behavior: string;
  entrance_exam_minimum_score_pct: string;
  video_thumbnail_image_asset_path: string;
  invitation_only?: boolean;
  catalog_visibility?: string;
  course_outline?: OutlineNode[];
  course_price?: string;
  platform_key?: string;
  org?: string;
  display_name?: string;
  mentor_hidden?: boolean;
  mentor_uuid?: string;
  agent_content_mode?: boolean | null;
  course_content_mode?: boolean | null;
  agent_autoplay?: boolean | null;
}

export interface Course {
  id?: number;
  data?: CourseData;
  course_id: string;
  name: string;
  slug?: string | null;
  skills?: string[];
  platform_key?: string;
  platform_name?: string;
  item_id?: string;
  edx_data?: CourseEdxData;
  active?: boolean;
  user_id?: number;
  created?: string;
}

export interface RecommendedCourseResult {
  type: string;
  data: Course;
  edx_data?: CourseEdxData;
}

export interface RecommendedCoursesResponse {
  results: RecommendedCourseResult[];
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
}

export interface EnrolledCourse {
  user_id: number;
  username: string;
  email: string;
  course_id: string;
  active: boolean;
  created: string;
  started: string | null;
  ended: string | null;
  expired: string | null;
  metadata: any | null;
  course_name: string;
}

export interface EnrolledCourseResponse {
  count: number;
  next_page: number | null;
  previous_page: number | null;
  results: EnrolledCourse[];
}

export interface CourseFacet {
  slug: string;
  label: string;
  terms: CourseFacetTerm[];
  expanded?: boolean;
}

export interface CourseFacetTerm {
  key: string;
  count: number;
}

export interface OutlineNode {
  type: string;
  name: string;
  children: OutlineNode[];
}

export interface CourseOutlineDisplay {
  title: string;
  children?: CourseOutlineDisplay[];
}

export interface CourseOutlineChildNode {
  id: string;
  block_id: string;
  lms_web_url?: string;
  legacy_web_url?: string;
  student_view_url?: string;
  type: string;
  display_name: string;
  graded?: boolean;
  start?: string;
  has_score?: boolean;
  resume_block?: boolean;
  completion?: number;
  complete?: boolean;
  scored?: boolean;
  num_graded_problems?: number;
  children?: CourseOutlineChildNode[];
  special_exam_info?: boolean;
}

export interface CourseBlockDetailsBlock {
  id: string;
  block_id: string;
  lms_web_url?: string;
  legacy_web_url?: string;
  student_view_url?: string;
  type: string;
  display_name: string;
}

export interface CourseBlockDetailsResponse {
  root: string;
  blocks: Record<string, CourseBlockDetailsBlock>;
}

export interface CourseOutlineResponse {
  display_name: string;
  graded: boolean;
  has_scheduled_content: boolean;
  has_score: boolean;
  id: string;
  legacy_web_url: string;
  lms_web_url: string;
  num_graded_problems: number;
  resume_block: boolean;
  scored: boolean;
  start: string;
  student_view_url: string;
  type: string;
  children: CourseOutlineChildNode[];
}

export interface CourseEligibilityResponse {
  is_enrolled: boolean;
  can_enroll: boolean;
  invitation_only: boolean;
  is_admin: boolean;
  is_eligible?: boolean;
}

export interface CourseEnrollmentRequest {
  course_details: {
    course_id: string;
  };
}

export interface CourseMode {
  slug: string;
  name: string;
  min_price: number;
  suggested_prices: string;
  currency: string;
  expiration_datetime: string | null;
  description: string | null;
  sku: string | null;
  bulk_sku: string | null;
}

export interface CourseEnrollmentResponse {
  created: string;
  mode: string;
  is_active: boolean;
  course_details: {
    course_id: string;
    course_name: string;
    enrollment_start: string;
    enrollment_end: string | null;
    course_start: string;
    course_end: string | null;
    invite_only: boolean;
    course_modes: CourseMode[];
    pacing_type: string;
  };
  user: string;
}

export interface CertificateData {
  cert_status: string;
  cert_web_view_url: string | null;
  download_url: string | null;
  certificate_available_date: string | null;
}

export interface CompletionSummary {
  complete_count: number;
  incomplete_count: number;
  locked_count: number;
}

export interface CourseGrade {
  letter_grade: string | null;
  percent: number;
  is_passing: boolean;
}

export interface AssignmentPolicy {
  num_droppable: number;
  num_total: number;
  short_label: string;
  type: string;
  weight: number;
}

export interface GradeRange {
  Pass: number;
}

export interface GradingPolicy {
  assignment_policies: AssignmentPolicy[];
  grade_range: GradeRange;
}

export interface ProblemScore {
  // Add specific properties if needed
}

export interface Subsection {
  assignment_type: string | null;
  block_key: string;
  display_name: string;
  has_graded_assignment: boolean;
  override: any | null;
  learner_has_access: boolean;
  num_points_earned: number;
  num_points_possible: number;
  percent_graded: number;
  problem_scores: ProblemScore[];
  show_correctness: string;
  show_grades: boolean;
  url: string;
}

export interface SectionScore {
  display_name: string;
  subsections: Subsection[];
}

export interface VerificationData {
  link: string | null;
  status: string;
  status_date: string | null;
}

export interface CourseProgress {
  can_show_upgrade_sock: boolean;
  verified_mode: string | null;
  access_expiration: string | null;
  certificate_data: CertificateData;
  completion_summary: CompletionSummary;
  course_grade: CourseGrade;
  credit_course_requirements: any | null;
  end: string | null;
  enrollment_mode: string;
  grading_policy: GradingPolicy;
  has_scheduled_content: boolean;
  section_scores: SectionScore[];
  studio_url: string;
  username: string;
  user_has_passing_grade: boolean;
  verification_data: VerificationData;
}

export interface CourseCompletionData {
  total_units: number;
  total_blocks: number;
  total_sections: number;
  completed_units: number;
  completed_blocks: number;
  total_subsections: number;
  completed_sections: number;
  completed_subsections: number;
}

export interface CourseCompletion {
  course_id: string;
  org: string;
  user_id: number;
  username: string;
  completion_percentage: number;
  completed: boolean;
  last_updated: string;
  completion_date: string | null;
  completion_data: CourseCompletionData;
  grading_percentage: number;
  passed: boolean;
  passing_date: string | null;
  grade_data: Record<string, any>;
}
