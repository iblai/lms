// @ts-ignore
import { useLazyGetRecommendationsAiSearchQuery } from '@iblai/iblai-js/data-layer';
import { RecommendedCourseResult } from '@/types/courses';
import { getOrg, getTenant } from '@/utils/helpers';
import { useEffect, useState } from 'react';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

export const useRecommendedCourses = ({
  limit = 8,
  search = '',
  forceLimit = false,
  tenant = '',
}: {
  limit?: number;
  search?: string;
  forceLimit?: boolean;
  tenant?: string;
}) => {
  const { metadata } = useTenantMetadata({
    org: getTenant(),
  });
  const [
    getRecommendationsAiSearch,
    { isLoading: isLoadingRecommendedCourses, error: errorRecommendedCourses },
  ] = useLazyGetRecommendationsAiSearchQuery();

  const [userCoursesWithMetaData, setUserCoursesWithMetaData] = useState<RecommendedCourseResult[]>(
    [],
  );
  const [filteredCoursesWithMetaData, setFilteredCoursesWithMetaData] = useState<
    RecommendedCourseResult[]
  >([]);

  const handleFetchCourses = async () => {
    try {
      setUserCoursesWithMetaData([]);
      setFilteredCoursesWithMetaData([]);
      const { data: aiSearchResponse } = await getRecommendationsAiSearch(
        {
          params: {
            platform_key: tenant || getTenant(),
            recommendation_type: 'courses',
            limit: limit,
            platform_org: getOrg(),
            ...(search && { search_terms: search }),
            ...(metadata?.skills_include_community_courses && { include_main_catalog: true }),
          },
        },
        true,
      );

      if (Array.isArray(aiSearchResponse?.recommendations)) {
        // Transform AI search recommendations to RecommendedCourseResult format
        const transformedCourses: RecommendedCourseResult[] = aiSearchResponse.recommendations.map(
          (rec: any) => ({
            type: 'course',
            data: {
              course_id: rec.course_id,
              name: rec.course_title,
              platform_key: rec.platform_key,
              edx_data: rec.edx_data,
              data: {
                tags: rec.domain ? [rec.domain] : null,
                level: rec.difficulty_level,
                custom: null,
                topics: [],
                subject: null,
                industry: null,
                job_role: null,
                promotion: null,
                credential: null,
                social_team: null,
                usage_limit: null,
                audit_allowed: null,
                social_channels: null,
                certificate_type: null,
                ...rec.edx_data,
              },
            },
          }),
        );

        const limitedRecommendedCourses = forceLimit
          ? transformedCourses.slice(0, limit)
          : transformedCourses;
        setUserCoursesWithMetaData(limitedRecommendedCourses);
        setFilteredCoursesWithMetaData(limitedRecommendedCourses);
      }
    } catch (error) {
      setUserCoursesWithMetaData([]);
      setFilteredCoursesWithMetaData([]);
    }
  };

  const handleInPageSearch = async () => {
    if (search.length > 2) {
      const filteredCourses = userCoursesWithMetaData.filter((course: RecommendedCourseResult) =>
        course.data.name.toLowerCase().includes(search.toLowerCase()),
      );
      setFilteredCoursesWithMetaData(filteredCourses);
    } else {
      setFilteredCoursesWithMetaData(userCoursesWithMetaData);
    }
  };

  useEffect(() => {
    handleFetchCourses();
  }, [metadata?.skills_include_community_courses]);

  useEffect(() => {
    handleInPageSearch();
  }, [search]);

  return {
    recommendedCourses: filteredCoursesWithMetaData,
    allRecommendedCourses: userCoursesWithMetaData,
    isLoading: isLoadingRecommendedCourses,
    isError: errorRecommendedCourses,
  };
};
