import { SkeletonMultiplier } from './skeleton-multiplier';
import { SkeletonDiscoverFilterBox } from './skeleton-discover-filter-box';
import { DefaultEmptyBox } from './default-empty-box';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FacetFilterContext } from '@/contexts/facet-filter-context';
import { useContext } from 'react';

export const DiscoverFacetsFilter = () => {
  const {
    facetsLoading,
    isError,
    facets,
    handleToggleFacet,
    handleFilterFacets,
    isFacetTermSelected,
    handleSelectFacets,
  } = useContext(FacetFilterContext);

  if (facetsLoading) {
    return (
      <div className="mb-4">
        <SkeletonMultiplier multiplier={10} Skeleton={SkeletonDiscoverFilterBox} />
      </div>
    );
  }

  if ((!facetsLoading && isError) || (!facetsLoading && !isError && facets.length === 0)) {
    <DefaultEmptyBox message="No content filters found." />;
  }

  if (!facetsLoading && !isError && facets.length > 0) {
    return facets.map((facet, index) => {
      return (
        <div className="mb-4" key={index} data-testid="facet-filter">
          <div
            className="mb-2 flex cursor-pointer items-center justify-between"
            onClick={() => handleToggleFacet(facet?.slug)}
          >
            <h4 className="text-sm font-medium text-gray-700 capitalize">{facet?.label}</h4>
            {facet?.expanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>

          {facet?.expanded && (
            <div className="space-y-3">
              <div className="mb-2 rounded-md bg-gray-100 p-2">
                <input
                  type="text"
                  placeholder="Filter"
                  className="w-full border-none bg-transparent text-sm focus:outline-none"
                  onChange={(e) => handleFilterFacets(facet.slug, e.target.value)}
                />
              </div>

              {facet?.terms.map((term, index) => (
                <div key={`${facet.slug}-${term.key}-${index}`} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`${facet.slug}-${term.key}`}
                    className="h-4 w-4 rounded border-gray-300 text-amber-500 accent-amber-500 focus:ring-amber-500"
                    checked={isFacetTermSelected(facet.slug, term.key) || false}
                    onChange={() => handleSelectFacets(facet.slug, term.key)}
                  />
                  <label
                    htmlFor={`${facet.slug}-${term.key}`}
                    className="ml-2 text-sm text-gray-700 capitalize"
                  >
                    {term.key} ({term.count})
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  }
};
