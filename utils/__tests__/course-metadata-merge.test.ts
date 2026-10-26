import { describe, it, expect } from 'vitest';
import { mergeCourseMetadata } from '../course-metadata-merge';

const COURSE = 'course-v1:acme+CS101+2026_T1';

const edxDetail = {
  course_id: COURSE,
  name: 'Intro to CS',
  org: 'acme',
  short_description: 'A short blurb',
  overview: '<p>About</p>',
  effort: '3h/week',
  start: '2026-01-01T00:00:00Z',
  end: null,
  enrollment_start: '2025-12-01T00:00:00Z',
  enrollment_end: null,
  pacing: 'self',
  invitation_only: true,
  media: {
    course_image: { uri: '/asset-v1:acme+CS101+2026_T1+type@asset+block@images_course_image.jpg' },
    banner_image: { uri: '/asset-v1:acme+CS101+2026_T1+type@asset+block@banner.png' },
    course_video: { uri: null },
  },
};

describe('mergeCourseMetadata', () => {
  it('rebuilds the plugin payload from DM metadata plus the edX course detail', () => {
    const merged = mergeCourseMetadata(
      COURSE,
      { platform_key: 'acme', slug: 'intro', agent_content_mode: true, mentor_uuid: 'm-1' },
      edxDetail,
    );

    expect(merged).toMatchObject({
      platform_key: 'acme',
      slug: 'intro',
      agent_content_mode: true,
      mentor_uuid: 'm-1',
      course_key: COURSE,
      org: 'acme',
      title: 'Intro to CS',
      display_name: 'Intro to CS',
      short_description: 'A short blurb',
      description: 'A short blurb',
      overview: '<p>About</p>',
      effort: '3h/week',
      start_date: '2026-01-01T00:00:00Z',
      end_date: null,
      enrollment_start: '2025-12-01T00:00:00Z',
      self_paced: true,
      invitation_only: true,
      course_image_asset_path:
        '/asset-v1:acme+CS101+2026_T1+type@asset+block@images_course_image.jpg',
      course_image_name: 'images_course_image.jpg',
      banner_image_name: 'banner.png',
      intro_video: null,
    });
    // Studio-only details have no source through DM.
    expect(merged.learning_info).toEqual([]);
    expect(merged.instructor_info).toEqual({ instructors: [] });
    expect(merged.language).toBe('');
    expect(merged.course_price).toBeUndefined();
  });

  it('tolerates a missing DM record and a sparse edX detail', () => {
    const merged = mergeCourseMetadata(COURSE, null, { course_id: COURSE, name: 'X', org: 'acme' });
    expect(merged.course_key).toBe(COURSE);
    expect(merged.self_paced).toBe(false);
    expect(merged.invitation_only).toBe(false);
    expect(merged.course_image_asset_path).toBe('');
    expect(merged.course_image_name).toBe('');
    expect(merged.overview).toBe('');
  });

  it('falls back to the course key for org and key when edX gives none', () => {
    const merged = mergeCourseMetadata(COURSE, {}, {});
    expect(merged.course_key).toBe(COURSE);
    expect(merged.org).toBe('acme');
    expect(merged.title).toBe('');
  });
});
