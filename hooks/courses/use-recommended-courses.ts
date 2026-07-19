// @ts-ignore
import { useGetRecommendationsAiSearchQuery } from '@iblai/iblai-js/data-layer';
import { RecommendedCourseResult } from '@/types/courses';
import { getOrg, getTenant } from '@/utils/helpers';
import { useMemo } from 'react';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

/**
 * Remounts within this window render straight from the cache with no
 * request at all; older cache entries still render instantly while a
 * silent background refresh runs (seconds).
 */
const RECOMMENDATIONS_REFRESH_AFTER_SECONDS = 120;

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
  const { metadata, isLoading: metadataLoading } = useTenantMetadata({
    org: getTenant(),
  });

  const {
    data: aiSearchResponse,
    isLoading: isLoadingRecommendedCourses,
    error: errorRecommendedCourses,
  } = useGetRecommendationsAiSearchQuery(
    {
      params: {
        platform_key: tenant || getTenant(),
        recommendation_type: 'courses',
        limit: limit,
        platform_org: getOrg(),
        ...(metadata?.skills_include_community_courses && { include_main_catalog: true }),
      },
    },
    {
      // Tenant metadata decides `include_main_catalog` — subscribing before
      // it resolves would fire a throwaway request under the wrong cache
      // key.
      skip: metadataLoading,
      refetchOnMountOrArgChange: RECOMMENDATIONS_REFRESH_AFTER_SECONDS,
    },
  );

  const userCoursesWithMetaData = useMemo<RecommendedCourseResult[]>(() => {
    if (!Array.isArray(aiSearchResponse?.recommendations)) {
      return [];
    }
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
    return forceLimit ? transformedCourses.slice(0, limit) : transformedCourses;
  }, [aiSearchResponse, forceLimit, limit]);

  // In-page search stays client-side — it narrows the already-fetched list
  // without refiring the endpoint.
  const filteredCoursesWithMetaData = useMemo<RecommendedCourseResult[]>(() => {
    if (search.length > 2) {
      return userCoursesWithMetaData.filter((course: RecommendedCourseResult) =>
        course.data.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return userCoursesWithMetaData;
  }, [search, userCoursesWithMetaData]);

  return {
    recommendedCourses: filteredCoursesWithMetaData,
    allRecommendedCourses: userCoursesWithMetaData,
    isLoading: metadataLoading || (isLoadingRecommendedCourses && !aiSearchResponse),
    isError: errorRecommendedCourses,
  };
};
