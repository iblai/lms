import { GenericPagination } from '@/types/discover';
// @ts-ignore
import {
  useGetCatalogSearchQuery,
  useGetPersonnalizedSearchQuery,
  useLazyGetCatalogSearchQuery,
  useLazyGetPersonnalizedSearchQuery,
} from '@iblai/iblai-js/data-layer';
import { useState } from 'react';

/**
 * Remounts within this window render straight from the cache with no
 * request at all; older cache entries still render instantly while a
 * silent background refresh runs (seconds).
 */
export const CATALOG_REFRESH_AFTER_SECONDS = 120;

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

/**
 * Declarative, cached variant of {@link usePersonnalizedCatalog}: subscribe
 * to the catalog search for `params` and let RTK Query own the lifecycle.
 * Remounting a page reuses the cached payload instantly instead of
 * refetching behind a loader; when a background refresh does run, the
 * previous payload keeps rendering (`data` sticks across arg changes).
 */
export const usePersonnalizedCatalogQuery = ({
  params,
  isLoggedIn = true,
  skip = false,
}: {
  params: PersonnalizedCatalogSearchParams;
  isLoggedIn?: boolean;
  skip?: boolean;
}) => {
  const personalizedQuery = useGetPersonnalizedSearchQuery([params], {
    skip: skip || !isLoggedIn,
    refetchOnMountOrArgChange: CATALOG_REFRESH_AFTER_SECONDS,
  });
  const catalogQuery = useGetCatalogSearchQuery([params], {
    skip: skip || isLoggedIn,
    refetchOnMountOrArgChange: CATALOG_REFRESH_AFTER_SECONDS,
  });
  const activeQuery = isLoggedIn ? personalizedQuery : catalogQuery;
  const data = activeQuery.data;

  const pagination: GenericPagination | null = data
    ? {
        count: data.count || 0,
        current_page: data.current_page || 0,
        total_pages: data.total_pages || 0,
      }
    : null;

  return {
    data,
    /** Nothing to display yet — first load (or still gated by `skip`). */
    isLoading: !data && !activeQuery.isError,
    /** A request is in flight (initial or silent background refresh). */
    isFetching: activeQuery.isFetching,
    isError: !!activeQuery.isError,
    pagination,
  };
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
