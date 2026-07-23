import { describe, expect, it } from 'vitest';
import {
  courseRootLocator,
  getYouTubeVideoId,
  isYouTubeVideoUrl,
  parseCourseKey,
} from '@/utils/course-creation';

describe('isYouTubeVideoUrl / getYouTubeVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?list=abc&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extracts the id from %s', (url, id) => {
    expect(isYouTubeVideoUrl(url)).toBe(true);
    expect(getYouTubeVideoId(url)).toBe(id);
  });

  it.each(['https://vimeo.com/12345', 'https://cdn.example.com/video.mp4', 'not a url', ''])(
    'rejects non-YouTube value %s',
    (url) => {
      expect(isYouTubeVideoUrl(url)).toBe(false);
      expect(getYouTubeVideoId(url)).toBe('');
    },
  );
});

describe('parseCourseKey', () => {
  it('splits a course key into id and run', () => {
    expect(parseCourseKey('course-v1:acme+CS101+2026')).toEqual({
      courseID: 'CS101',
      courseRun: '2026',
    });
  });

  it('returns empty parts for malformed keys', () => {
    expect(parseCourseKey('garbage')).toEqual({ courseID: '', courseRun: '' });
  });
});

describe('courseRootLocator', () => {
  it('builds the root course block locator', () => {
    expect(courseRootLocator('acme', 'CS101', '2026')).toBe(
      'block-v1:acme+CS101+2026+type@course+block@course',
    );
  });
});
