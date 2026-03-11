import { getRandomCourseImage, getTenant, getUserId, getUserName } from '@/utils/helpers';
import { useEffect, useState } from 'react';
import { useLazyGetUserAssignedPathwaysQuery } from '@/services/catalog';
import { PathwayCompletionResponse, PathwayEnrollmentPlus } from '@iblai/iblai-api';
import { config } from '@/lib/config';
// @ts-ignore
import {
  useLazyGetPathwayCompletionQuery,
  useLazyGetUserEnrolledPathwaysQuery,
  useLazyGetPathwayListQuery,
} from '@iblai/iblai-js/data-layer';
export const useProfilePathways = ({
  searchQuery,
  contentType = 'catalog',
}: {
  searchQuery: string;
  contentType?: 'catalog' | 'assigned' | 'enrolled';
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [getPathwayList, { isError: isCatalogPathwaysError }] = useLazyGetPathwayListQuery();
  const [getUserAssignedPathways, { isError: isAssignedPathwaysError }] =
    useLazyGetUserAssignedPathwaysQuery();
  const [getUserEnrolledPathways, { isError: isEnrolledPathwaysError }] =
    useLazyGetUserEnrolledPathwaysQuery();
  const [pathways, setPathways] = useState<PathwayEnrollmentPlus[]>([]);
  const [pathwayCompletions, setPathwayCompletions] = useState<PathwayCompletionResponse[]>([]);
  const [pathwayCompletionsLoading, setPathwayCompletionsLoading] = useState(false);
  const [filteredPathways, setFilteredPathways] = useState<PathwayEnrollmentPlus[]>([]);
  const [isError, setIsError] = useState<boolean>(false);

  const [getPathwayCompletion] = useLazyGetPathwayCompletionQuery();

  const handleFetchSinglePathwayEnrollmentStatus = async (pathway: PathwayEnrollmentPlus) => {
    try {
      const response = await getUserEnrolledPathways(
        [
          {
            username: getUserName(),
            pathwayUuid: pathway.pathway_uuid || '',
          },
        ],
        true,
      );
      return (
        Array.isArray(response.data) &&
        response.data.findIndex(
          (pre) => pre.active && pre?.pathway_uuid === pathway.pathway_uuid,
        ) !== -1
      );
    } catch (error) {
      return false;
    }
  };

  const handleFetchPathwayCompletions = async (pathways: PathwayEnrollmentPlus[]) => {
    setPathwayCompletionsLoading(true);
    try {
      const pathwayCompletions = await Promise.all(
        pathways.map(async (pathway) => {
          const response = await getPathwayCompletion([
            {
              pathwayUuid: pathway.pathway_uuid || '',
              username: getUserName(),
            },
          ]);
          return response.data || {};
        }),
      );
      setPathwayCompletions(pathwayCompletions as PathwayCompletionResponse[]);
      setPathwayCompletionsLoading(false);
    } catch (error) {
      console.error(JSON.stringify(error));
      setPathwayCompletions([]);
      setPathwayCompletionsLoading(false);
    }
  };

  const handleFetchCatalogPathways = async () => {
    setIsLoading(true);
    const response = await getPathwayList(
      [
        {
          username: getUserName(),
          platformKey: getTenant(),
        },
      ],
      true,
    );
    const fetchedPathways = response.data?.map((result: any) => ({
      ...result,
      metadata: {
        ...result.metadata,
        course_image_asset_path: result?.metadata?.course_image_asset_path
          ? config.urls.lms() + result?.metadata?.course_image_asset_path
          : getRandomCourseImage(),
      },
    }));
    setPathways(fetchedPathways || []);
    setFilteredPathways(fetchedPathways || []);
    handleFetchPathwayCompletions(fetchedPathways || []);
    setIsError(isCatalogPathwaysError);
    setIsLoading(false);
  };

  const handleFetchAssignedPathways = async () => {
    setIsLoading(true);
    const response = await getUserAssignedPathways(
      {
        user_id: getUserId(),
      },
      true,
    );
    setPathways(response.data?.results || []);
    setFilteredPathways(response.data?.results || []);
    handleFetchPathwayCompletions(response.data?.results || []);
    setIsError(isAssignedPathwaysError);
    setIsLoading(false);
  };

  const handleFetchEnrolledPathways = async () => {
    setIsLoading(true);
    const response = await getUserEnrolledPathways(
      [
        {
          username: getUserName(),
        },
      ],
      true,
    );
    setPathways((response.data as unknown as PathwayEnrollmentPlus[]) || []);
    setFilteredPathways((response.data as unknown as PathwayEnrollmentPlus[]) || []);
    handleFetchPathwayCompletions((response.data as unknown as PathwayEnrollmentPlus[]) || []);
    setIsError(isEnrolledPathwaysError);
    setIsLoading(false);
  };

  useEffect(() => {
    setPathways([]);
    setFilteredPathways([]);
    switch (contentType) {
      case 'assigned':
        handleFetchAssignedPathways();
        break;
      case 'enrolled':
        handleFetchEnrolledPathways();
        break;
      default:
        handleFetchCatalogPathways();
        break;
    }
  }, [contentType]);

  useEffect(() => {
    if (String(searchQuery).length > 2) {
      setFilteredPathways(
        pathways?.filter((pathway) =>
          pathway.name?.toLowerCase().includes(searchQuery.toLowerCase()),
        ) || [],
      );
    } else {
      setFilteredPathways(pathways || []);
    }
  }, [searchQuery]);

  return {
    pathways,
    filteredPathways,
    isLoading,
    isError,
    setPathways,
    setFilteredPathways,
    pathwayCompletions,
    pathwayCompletionsLoading,
    handleFetchSinglePathwayEnrollmentStatus,
  };
};
