import { GenericPagination } from '@/types/discover';
// @ts-ignore
import {
  useLazyGetCatalogSearchQuery,
  useLazyGetPersonnalizedSearchQuery,
} from '@iblai/iblai-js/data-layer';
import { useState } from 'react';

export type PersonnalizedCatalogSearchParams = {
  username: string;
  allowSkillSearch?: boolean;
  alphabetical?: boolean;
  certificate?: string[];
  content?: string[];
  courseId?: string;
  duration?: string[];
  language?: string[];
  level?: string[];
  limit?: number;
  offset?: number;
  orderAscending?: boolean;
  orderBy?: string;
  pathwayId?: string;
  price?: string;
  programId?: string;
  programType?: string[];
  promotion?: string[];
  query?: string;
  recommended?: boolean;
  resourceId?: string;
  resourceType?: string[];
  returnFacet?: boolean;
  returnItems?: boolean;
  roleId?: string;
  selfPaced?: string[];
  skillId?: string;
  skills?: string[];
  subject?: string[];
  tags?: string[];
  tenant?: string;
  topics?: string[];
  updateFacet?: string;
};

export const usePersonnalizedCatalog = ({ isLoggedIn = true }: { isLoggedIn?: boolean } = {}) => {
  const [getPersonnalizedSearch, { isLoading, isError }] = useLazyGetPersonnalizedSearchQuery();

  const [getCatalogSearch, { isLoading: isLoadingCatalog, isError: isErrorCatalog }] =
    useLazyGetCatalogSearchQuery();

  const [pagination, setPagination] = useState<GenericPagination | null>(null);

  const handleSearch = async (searchParams: PersonnalizedCatalogSearchParams) => {
    try {
      const searchFn = isLoggedIn ? getPersonnalizedSearch : getCatalogSearch;
      const response = await searchFn(
        [
          {
            ...searchParams,
          },
        ],
        true,
      );
      setPagination({
        count: response?.data?.count || 0,
        current_page: response?.data?.current_page || 0,
        total_pages: response?.data?.total_pages || 0,
      });
      return response;
    } catch (error) {
      return undefined;
    }
  };

  return {
    isLoading: isLoggedIn ? isLoading : isLoadingCatalog,
    isError: isLoggedIn ? isError : isErrorCatalog,
    handleSearch,
    pagination,
  };
};
