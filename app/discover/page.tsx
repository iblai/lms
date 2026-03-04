'use client';

import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { CourseCardSkeleton } from '@/components/course-card-skeleton';
import { Footer } from '@/components/footer';
import { useDiscover } from '@/hooks/discover/use-discover';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import _ from 'lodash';
import React from 'react';
import { DiscoverContentCard } from '@/components/discover-content-card';
import { DiscoverContent } from '@/types/discover';
import ReactPaginate from 'react-paginate';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DiscoverFacetsFilter } from '@/components/discover-facets-filter';
import { DiscoverFilterDrawer } from '@/components/discover-filter-drawer';
import { FacetFilterContext } from '@/contexts/facet-filter-context';
export default function DiscoverPage() {
  const [limit] = useState<number>(12);
  const searchParams = useSearchParams();
  const {
    contents,
    facets,
    contentsLoading,
    facetsLoading,
    isError,
    handleToggleFacet,
    selectedFacets,
    isFacetTermSelected,
    handleSelectFacets,
    handleFormatContents,
    pagination,
    setPage,
    handleFilterFacets,
    filteredFacets,
    setSelectedFacets,
  } = useDiscover({
    limit,
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('q')) {
      setSelectedFacets({
        ...selectedFacets,
        q: [decodeURIComponent(searchParams.get('q') || '')],
      });
    } else {
      setSelectedFacets({
        ...selectedFacets,
        q: [],
      });
    }
  }, [searchParams]);

  return (
    <>
      <FacetFilterContext.Provider
        value={{
          facetsLoading,
          isError,
          filteredFacets,
          facets,
          handleToggleFacet,
          handleFilterFacets,
          isFacetTermSelected,
          handleSelectFacets,
          filterDrawerOpen,
          setFilterDrawerOpen,
        }}
      >
        <main className="flex-1 flex overflow-hidden">
          {/* Filters Sidebar */}
          <div
            className="w-64 border-r border-gray-200 overflow-y-auto p-6 hidden md:block"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <h2 className="text-lg font-medium text-gray-600 mb-4">Explore Content</h2>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-700">Filter By</h3>
              </div>
              <DiscoverFacetsFilter />
            </div>
          </div>

          {/* Main Content */}
          <div
            className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 pt-4 md:pt-6 pb-16 md:pb-6"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div className="w-full pb-16">
              <div className="flex items-center justify-between mb-4 md:hidden">
                <h1 className="text-xl font-semibold text-gray-600">Featured Learning Content</h1>
                <Button variant="outline" size="sm" onClick={() => setFilterDrawerOpen(true)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              <h1 className="text-xl font-semibold text-gray-600 mb-4 hidden md:block">
                Featured Learning Content
              </h1>
              {filterDrawerOpen && <DiscoverFilterDrawer />}
              {/* Content Type Filter */}
              {!_.isEmpty(selectedFacets) && (
                <div className="mb-6 flex items-center gap-3">
                  {Object.keys(selectedFacets).map((selectedFacet: string, index: number) => {
                    if (selectedFacets?.[selectedFacet]?.length === 0) {
                      return;
                    }
                    return (
                      <div
                        key={`selected-facet-${selectedFacet}-${index}`}
                        className="bg-gray-100 rounded-md px-3 py-1 flex items-center text-sm"
                      >
                        <span className="text-gray-600 mr-1 capitalize">{selectedFacet}:</span>
                        {selectedFacets?.[selectedFacet]?.map(
                          (selectedTerm: string, index: number) => (
                            <React.Fragment key={index}>
                              <span className="text-gray-600 capitalize ml-1">{selectedTerm}</span>
                              <button
                                onClick={() => handleSelectFacets(selectedFacet, selectedTerm)}
                                className="ml-1 text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </React.Fragment>
                          ),
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {((!contentsLoading && isError) ||
                (!contentsLoading && !isError && contents?.length === 0)) && (
                <DefaultEmptyBox message="No content found." />
              )}

              {/* Course Grid */}
              <div className="grid grid-cols-1 min-[450px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 w-full overflow-hidden">
                {contentsLoading && (
                  <SkeletonMultiplier multiplier={10} Skeleton={CourseCardSkeleton} />
                )}
                {!contentsLoading &&
                  !isError &&
                  contents.length > 0 &&
                  contents.map((content: DiscoverContent, index) => (
                    <div key={`content-${index}`} className="w-full">
                      <DiscoverContentCard content={handleFormatContents(content)} />
                    </div>
                  ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-end mt-8 mb-6">
                <ReactPaginate
                  className="flex items-center space-x-2"
                  pageClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  activeClassName="bg-amber-50 text-amber-600 hover:bg-amber-100"
                  previousClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  nextClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  breakClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  pageCount={pagination?.total_pages || Math.ceil((pagination?.count || 1) / limit)}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  previousLabel="Previous"
                  nextLabel="Next"
                  onPageChange={(data) => {
                    setPage(data.selected + 1);
                  }}
                />
              </div>
            </div>
            <Footer />
          </div>
        </main>
      </FacetFilterContext.Provider>
    </>
  );
}
