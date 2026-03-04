import { useLazyGetCatalogSearchQuery } from '@iblai/iblai-js/data-layer';
interface CatalogSearchParams {
  query?: string;
  content?: string[];
  tenant?: string;
  limit?: number;
  offset?: number;
}

export const useCatalogSearch = () => {
  const [getCatalogSearch, { isLoading, isError }] = useLazyGetCatalogSearchQuery();
  const handleSearch = async (params: CatalogSearchParams) => {
    try {
      const response = await getCatalogSearch(
        [
          {
            ...params,
          },
        ],
        true,
      );
      return response;
    } catch (error) {
      console.error(JSON.stringify(error));
      return null;
    }
  };

  return { handleSearch, isLoading, isError };
};
