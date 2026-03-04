import {
  useLazyGetUserEnrolledCoursesQuery,
  useLazyGetUserAssignedCoursesQuery,
} from '@/services/courses';
import { Course, CourseEdxData, EnrolledCourse } from '@/types/courses';
import { getTenant, getUserId, getUserName } from '@/utils/helpers';
import { useEffect, useState } from 'react';
import { useCourseMetadata } from './use-course-metadata';
import { GenericPagination } from '@/types/discover';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

//TODO pagination

export const useUserCourses = ({
  limit = 8,
  search = '',
  page = 1,
  courseType = 'enrolled',
  useAPISearch = false,
}: {
  limit?: number;
  search?: string;
  page?: number;
  courseType?: string;
  useAPISearch?: boolean;
}) => {
  const { metadata } = useTenantMetadata({
    org: getTenant(),
  });
  const [
    getUserEnrolledCourses,
    { isLoading: isLoadingEnrolledCourses, isError: errorEnrolledCourses },
  ] = useLazyGetUserEnrolledCoursesQuery();
  const [
    getUserAssignedCourses,
    { isLoading: isLoadingAssignedCourses, isError: errorAssignedCourses },
  ] = useLazyGetUserAssignedCoursesQuery();

  const { handleFetchCourseMetaData } = useCourseMetadata();
  const [userCoursesWithMetaData, setUserCoursesWithMetaData] = useState<Course[]>([]);
  const [filteredCoursesWithMetaData, setFilteredCoursesWithMetaData] = useState<Course[]>([]);
  const [isLoadingCoursesMetaData, setIsLoadingCoursesMetaData] = useState<boolean>(false);
  const [pagination, setPagination] = useState<GenericPagination | null>(null);

  const handleFetchCourses = async () => {
    try {
      setUserCoursesWithMetaData([]);
      setFilteredCoursesWithMetaData([]);
      setIsLoadingCoursesMetaData(true);
      switch (courseType) {
        case 'assigned':
          const { data: assignedCourses } = await getUserAssignedCourses(
            {
              user_id: getUserId(),
              query: {
                page_size: limit,
                ...(search && { search }),
                ...(page && { page }),
              },
            },
            true,
          );
          if (Array.isArray(assignedCourses?.results)) {
            setPagination({
              count: assignedCourses?.count || 0,
              current_page: page,
              total_pages: Math.ceil(assignedCourses?.count / limit),
            });
            handleFetchAllCoursesMetaData(assignedCourses.results);
          }
          break;
        default:
          const { data: enrolledCourses } = await getUserEnrolledCourses(
            {
              username: getUserName(),
              query: {
                page_size: limit,
                ...(search && { search }),
                ...(page && { page }),
                platform_key: getTenant(),
                ...(metadata?.skills_include_community_courses && {
                  include_default_platform: 1,
                }),
              },
            },
            true,
          );
          if (Array.isArray(enrolledCourses?.results)) {
            setPagination({
              count: enrolledCourses?.count || 0,
              current_page: page,
              total_pages: Math.ceil(enrolledCourses?.count / limit),
            });
            handleFetchAllCoursesMetaData(enrolledCourses.results);
          }
          break;
      }
    } catch (error) {
      setUserCoursesWithMetaData([]);
      setFilteredCoursesWithMetaData([]);
      setIsLoadingCoursesMetaData(false);
    }
  };

  const handleFetchAllCoursesMetaData = async (enrolledCourses: EnrolledCourse[]) => {
    try {
      const coursesMetaData = await Promise.all(
        enrolledCourses.map(async (course: EnrolledCourse) => {
          return await handleFetchCourseMetaData(course.course_id);
        }),
      );
      const courseMetadata = coursesMetaData.filter(
        (data): data is CourseEdxData => data !== undefined,
      );
      const coursesWithMetaData = enrolledCourses.map((course: EnrolledCourse, index: number) => ({
        ...course,
        name: course.course_name,
        edx_data: courseMetadata[index],
      }));
      setUserCoursesWithMetaData(coursesWithMetaData);
      setFilteredCoursesWithMetaData(coursesWithMetaData);
      setIsLoadingCoursesMetaData(false);
    } catch (error) {
      setUserCoursesWithMetaData([]);
      setFilteredCoursesWithMetaData([]);
      setIsLoadingCoursesMetaData(false);
    }
  };

  const handleInPageSearch = async () => {
    if (search.length > 2) {
      const filteredCourses = userCoursesWithMetaData.filter((course: Course) =>
        course.name.toLowerCase().includes(search.toLowerCase()),
      );
      setFilteredCoursesWithMetaData(filteredCourses);
    } else {
      setFilteredCoursesWithMetaData(userCoursesWithMetaData);
    }
  };

  useEffect(() => {
    if (!useAPISearch) {
      handleInPageSearch();
    } else {
      handleFetchCourses();
    }
  }, [search, useAPISearch]);

  useEffect(() => {
    handleFetchCourses();
  }, [courseType, page, metadata?.skills_include_community_courses]);

  return {
    userCourses: filteredCoursesWithMetaData,
    isLoadingUserCourses:
      isLoadingEnrolledCourses || isLoadingAssignedCourses || isLoadingCoursesMetaData,
    errorUserCourses: errorEnrolledCourses || errorAssignedCourses,
    pagination,
  };
};
