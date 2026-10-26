import type { CourseEdxData, EdxCourseDetail } from '@/types/courses';

/** `/asset-v1:org+c+r+type@asset+block@images_course_image.jpg` → `images_course_image.jpg`. */
const assetFileName = (path: string | null | undefined): string =>
  path ? (path.split('@').pop() ?? '') : '';

/**
 * Rebuilds the edX plugin's `course_metadata` payload from its two DM-side
 * sources: DM's public catalog metadata and Open edX's course detail read
 * through DM's proxy (iblai-platform#2707 row 7).
 *
 * The plugin also exposed Studio-only course details (language, duration,
 * syllabus, learning and instructor info, price, certificate and entrance-exam
 * settings). Those have no learner-readable source through DM, so they come
 * back empty, and `description` falls back to the short description.
 */
export function mergeCourseMetadata(
  courseKey: string,
  dmMetadata: Record<string, unknown> | null | undefined,
  edxCourse: Partial<EdxCourseDetail> | null | undefined,
): CourseEdxData {
  const edx = edxCourse ?? {};
  const media = edx.media ?? {};
  const courseImage = media.course_image?.uri ?? '';
  const bannerImage = media.banner_image?.uri ?? '';
  const shortDescription = edx.short_description ?? '';
  const name = edx.name ?? '';

  return {
    ...(dmMetadata ?? {}),
    course_key: edx.course_id ?? courseKey,
    org: edx.org ?? courseKey.replace(/^course-v1:/, '').split('+')[0],
    title: name,
    display_name: name,
    short_description: shortDescription,
    description: shortDescription,
    overview: edx.overview ?? '',
    effort: edx.effort ?? null,
    start_date: edx.start ?? '',
    end_date: edx.end ?? null,
    enrollment_start: edx.enrollment_start ?? null,
    enrollment_end: edx.enrollment_end ?? null,
    self_paced: edx.pacing === 'self',
    invitation_only: edx.invitation_only ?? false,
    course_image_asset_path: courseImage,
    course_image_name: assetFileName(courseImage),
    banner_image_asset_path: bannerImage,
    banner_image_name: assetFileName(bannerImage),
    intro_video: media.course_video?.uri ?? null,
    language: '',
    duration: '',
    subtitle: '',
    syllabus: null,
    about_sidebar_html: '',
    license: null,
    video_thumbnail_image_name: '',
    video_thumbnail_image_asset_path: '',
    pre_requisite_courses: [],
    entrance_exam_enabled: '',
    entrance_exam_id: '',
    entrance_exam_minimum_score_pct: '',
    certificate_available_date: null,
    certificates_display_behavior: '',
    learning_info: [],
    instructor_info: { instructors: [] },
  };
}
