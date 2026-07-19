import { useMemo } from 'react';
import { isLoggedIn } from '@iblai/iblai-js/web-utils';
import { getUserName } from '@/utils/helpers';
import { useGetUserEnrolledCoursesQuery } from '@/services/courses';
import {
  useGetUserCatalogPathwaysQuery,
  useGetUserEnrolledProgramsQuery,
} from '@/services/catalog';
import { DiscoverContentCardProps } from '@/types/discover';

const ENROLLED_COURSES_PAGE_SIZE = 100;

/**
 * Remounts within this window render straight from the cache with no
 * request at all; older cache entries still render instantly while a
 * silent background refresh runs (seconds).
 */
const ENROLLMENTS_REFRESH_AFTER_SECONDS = 120;

export type EnrolledContentType = 'courses' | 'programs' | 'pathways';

/**
 * The learner's enrollments (courses, programs, pathways) shaped for the
 * centralized catalog page:
 *  - `enrolledIds` — every id the user is enrolled in, to pin an
 *    "Enrolled" pill on matching catalog search results;
 *  - `enrolledCards` — the enrollments as ready-to-render catalog cards,
 *    for the "Enrolled" filter view.
 */
export const useUserEnrollments = ({ tenant }: { tenant: string }) => {
  const username = getUserName();
  const skip = !isLoggedIn() || !username || !tenant;

  const coursesQ = useGetUserEnrolledCoursesQuery(
    {
      username: username ?? '',
      query: { page_size: ENROLLED_COURSES_PAGE_SIZE, platform_key: tenant },
    },
    { skip, refetchOnMountOrArgChange: ENROLLMENTS_REFRESH_AFTER_SECONDS },
  );
  const programsQ = useGetUserEnrolledProgramsQuery(
    { username: username ?? '', platform_key: tenant },
    { skip, refetchOnMountOrArgChange: ENROLLMENTS_REFRESH_AFTER_SECONDS },
  );
  const pathwaysQ = useGetUserCatalogPathwaysQuery(
    { username: username ?? '', platform_key: tenant },
    { skip, refetchOnMountOrArgChange: ENROLLMENTS_REFRESH_AFTER_SECONDS },
  );

  const enrolledCards = useMemo<Record<EnrolledContentType, DiscoverContentCardProps[]>>(() => {
    const courses = (coursesQ.data?.results ?? [])
      .filter((course) => course.course_name)
      .map((course) => ({
        title: course.course_name,
        contentType: 'course',
        url: `/courses/${course.course_id}`,
        image: '',
        id: course.course_id,
        enrolled: true,
      }));

    const programs = (programsQ.data ?? [])
      .filter((program) => program.name || program.program_id)
      .map((program) => ({
        ...program,
        title: program.name || program.program_id || '',
        contentType: 'program',
        url: `/programs/${program.program_key}`,
        image: '',
        id: program.program_id || program.program_key || '',
        enrolled: true,
      }));

    const seenPathways = new Set<string>();
    const pathways = (pathwaysQ.data ?? [])
      .filter((pathway: any) => {
        const key = String(pathway.pathway_uuid || pathway.pathway_id || pathway.id || '');
        if (!key || seenPathways.has(key)) return false;
        seenPathways.add(key);
        return true;
      })
      .map((pathway: any) => ({
        ...pathway,
        title: pathway.name || pathway.pathway_id || '',
        contentType: 'pathway',
        url: '',
        image: '',
        id: pathway.pathway_uuid || pathway.pathway_id || '',
        enrolled: true,
      }));

    return { courses, programs, pathways };
  }, [coursesQ.data, programsQ.data, pathwaysQ.data]);

  const enrolledIds = useMemo(() => {
    const ids = new Set<string>();
    coursesQ.data?.results?.forEach((course) => ids.add(course.course_id));
    programsQ.data?.forEach((program) => {
      if (program.program_id) ids.add(program.program_id);
      if (program.program_key) ids.add(program.program_key);
    });
    pathwaysQ.data?.forEach((pathway: any) => {
      if (pathway.pathway_uuid) ids.add(pathway.pathway_uuid);
      if (pathway.pathway_id) ids.add(pathway.pathway_id);
    });
    return ids;
  }, [coursesQ.data, programsQ.data, pathwaysQ.data]);

  return {
    enrolledIds,
    enrolledCards,
    enrolledTotal:
      enrolledCards.courses.length + enrolledCards.programs.length + enrolledCards.pathways.length,
    enrollmentsLoading: coursesQ.isLoading || programsQ.isLoading || pathwaysQ.isLoading,
  };
};
