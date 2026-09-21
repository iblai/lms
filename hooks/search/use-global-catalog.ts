import { GenericPagination } from '@/types/discover';
import { GlobalSearchArgs, useGetSearchGlobalQuery } from '@iblai/iblai-js/data-layer';

/**
 * Remounts within this window render straight from the cache with no
 * request at all; older cache entries still render instantly while a
 * silent background refresh runs (seconds).
 */
export const CATALOG_REFRESH_AFTER_SECONDS = 120;

export type GlobalCatalogSearchParams = GlobalSearchArgs;

/**
 * Declarative, cached subscription to the global catalog search
 * (`GET /api/search/global/`). The same endpoint serves anonymous and
 * logged-in users, so there is no personalized/public split to manage.
 * Remounting a page reuses the cached payload instantly instead of
 * refetching behind a loader; when a background refresh does run, the
 * previous payload keeps rendering (`data` sticks across arg changes).
 */
export const useGlobalCatalogQuery = ({
  params,
  skip = false,
}: {
  params: GlobalCatalogSearchParams;
  skip?: boolean;
}) => {
  const query = useGetSearchGlobalQuery([params], {
    skip,
    refetchOnMountOrArgChange: CATALOG_REFRESH_AFTER_SECONDS,
  });
  const data = query.data;

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
    isLoading: !data && !query.isError,
    /** A request is in flight (initial or silent background refresh). */
    isFetching: query.isFetching,
    isError: !!query.isError,
    pagination,
  };
};
