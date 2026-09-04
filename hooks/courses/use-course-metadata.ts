import {
  useLazyGetCourseCompletionOutlinesQuery,
  useLazyGetCourseEligibilityQuery,
  useLazyGetCourseMetaDataQuery,
} from '@/services/course-metadata';
import { CourseEligibilityResponse } from '@/types/courses';
import { isLoggedIn } from '@iblai/iblai-js/web-utils';

export const useCourseMetadata = () => {
  const userLoggedIn = isLoggedIn();
  const [getCourseMetaData, { isLoading, isError }] = useLazyGetCourseMetaDataQuery();

  const [
    getCourseCompletionOutlines,
    { isLoading: isLoadingCompletionOutlines, isError: isErrorCompletionOutlines },
  ] = useLazyGetCourseCompletionOutlinesQuery();

  const [getCourseEligibility] = useLazyGetCourseEligibilityQuery();

  const handleFetchCourseMetaData = async (courseKey: string) => {
    try {
      const { data: courseMetaData } = await getCourseMetaData(
        { courseKey, noAuth: !userLoggedIn },
        true,
      );
      return courseMetaData;
    } catch (error) {
      console.error('Failed to fetch course metadata:', error);
      return {};
    }
  };

  const handleFetchCourseEligibility = async (
    courseKey: string,
  ): Promise<CourseEligibilityResponse | null> => {
    try {
      const { data: courseEligibility } = await getCourseEligibility({ courseKey });
      return courseEligibility || null;
    } catch (error) {
      console.error('Failed to fetch course eligibility:', error);
      return null;
    }
  };

  const handleFetchCourseCompletionOutlines = async (courseKey: string) => {
    try {
      const { data: courseCompletionOutlines } = await getCourseCompletionOutlines({ courseKey });
      return courseCompletionOutlines;
    } catch (error) {
      console.error('Failed to fetch course completion outlines:', error);
      return {};
    }
  };

  return {
    handleFetchCourseMetaData,
    handleFetchCourseCompletionOutlines,
    handleFetchCourseEligibility,
    isLoading,
    isError,
    isLoadingCompletionOutlines,
    isErrorCompletionOutlines,
  };
};
