import {
  useLazyGetCourseCompletionOutlinesQuery,
  useLazyGetCourseEligibilityQuery,
  useLazyGetCourseMetaDataQuery,
} from '@/services/course-metadata';
import { CourseEligibilityResponse } from '@/types/courses';

export const useCourseMetadata = () => {
  const [getCourseMetaData, { isLoading, isError }] = useLazyGetCourseMetaDataQuery();

  const [
    getCourseCompletionOutlines,
    { isLoading: isLoadingCompletionOutlines, isError: isErrorCompletionOutlines },
  ] = useLazyGetCourseCompletionOutlinesQuery();

  const [getCourseEligibility] = useLazyGetCourseEligibilityQuery();

  const handleFetchCourseMetaData = async (courseKey: string) => {
    try {
      const { data: courseMetaData } = await getCourseMetaData({ courseKey }, true);
      return courseMetaData;
    } catch (error) {
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
      return null;
    }
  };

  const handleFetchCourseCompletionOutlines = async (courseKey: string) => {
    try {
      const { data: courseCompletionOutlines } = await getCourseCompletionOutlines({ courseKey });
      return courseCompletionOutlines;
    } catch (error) {
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
