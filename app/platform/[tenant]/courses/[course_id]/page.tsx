import { getCourseServerData } from '@/lib/utils/seo-data';
import { CourseShell } from './_components/course-shell';
import { CourseAboutServer } from './_components/course-about-server';
import { CourseSidebar } from './_components/course-sidebar';
import { CourseSideEffects } from './_components/course-side-effects';
import { CourseDetailClientFallback } from './_components/course-detail-client-fallback';

/**
 * Course detail page. Server-rendered so crawlers (and Google's first,
 * JS-less pass) see the real content: the H1, the course description/overview
 * headings, and the facts are all in the initial HTML. Only the tab switching,
 * Syllabus panel, enroll CTA, and mentor wiring load on the client.
 *
 * If the public course fetch fails (non-public course, auth-gated env), we fall
 * back to the previous fully-client experience so nothing regresses.
 */
export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ tenant: string; course_id: string }>;
}) {
  const { course_id } = await params;
  const course = await getCourseServerData(decodeURIComponent(course_id));

  if (!course) {
    return <CourseDetailClientFallback />;
  }

  return (
    <>
      <CourseShell
        title={course.title}
        about={<CourseAboutServer course={course} />}
        sidebar={<CourseSidebar course={course} />}
      />
      <CourseSideEffects />
    </>
  );
}
