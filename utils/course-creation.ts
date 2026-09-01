/** Matches youtube.com/watch, youtu.be, youtube.com/embed and shorts URLs. */
const YOUTUBE_URL_PATTERN =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

export function isYouTubeVideoUrl(url: string): boolean {
  return YOUTUBE_URL_PATTERN.test(url.trim());
}

export function getYouTubeVideoId(url: string): string {
  const match = url.trim().match(YOUTUBE_URL_PATTERN);
  return match ? match[1] : '';
}

/** `course-v1:{org}+{courseID}+{courseRun}` → `{ courseID, courseRun }`. */
export function parseCourseKey(courseKey: string): { courseID: string; courseRun: string } {
  const [, courseID = '', courseRun = ''] = courseKey.split('+');
  return { courseID, courseRun };
}

/** Root course block locator that chapters are created under. */
export function courseRootLocator(org: string, courseID: string, courseRun: string): string {
  return `block-v1:${org}+${courseID}+${courseRun}+type@course+block@course`;
}
