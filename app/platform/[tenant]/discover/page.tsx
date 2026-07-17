'use client';

import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { CourseCardSkeleton } from '@/components/course-card-skeleton';
import { useDiscover, ENROLLMENT_FACET_SLUG } from '@/hooks/discover/use-discover';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import _ from 'lodash';
import React from 'react';
import { DiscoverContentCard } from '@/components/discover-content-card';
import AccessiblePaginate from '@/components/ui/accessible-paginate';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DiscoverFacetsFilter } from '@/components/discover-facets-filter';
import { DiscoverFilterDrawer } from '@/components/discover-filter-drawer';
import { FacetFilterContext } from '@/contexts/facet-filter-context';
export default function DiscoverPage() {
  const [limit] = useState<number>(12);
  const searchParams = useSearchParams();
  const {
    facets,
    contentsLoading,
    facetsLoading,
    isError,
    handleToggleFacet,
    selectedFacets,
    isFacetTermSelected,
    handleSelectFacets,
    pagination,
    setPage,
    handleFilterFacets,
    filteredFacets,
    setSelectedFacets,
    displayCards,
    enrolledOnly,
    enrollmentsLoading,
    recommendedOnly,
    recommendationsLoading,
  } = useDiscover({
    limit,
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Seed the filters from the URL: `q` (navbar search), `content`
  // (courses|programs|pathways), `enrolled=true` (the sidebar's Courses /
  // Programs / Pathways entries deep-link the user's enrollments) and
  // `recommended=true` on this centralized catalog page.
  useEffect(() => {
    const contentParam = searchParams.get('content');
    const enrolledParam = searchParams.get('enrolled');
    const recommendedParam = searchParams.get('recommended');
    setSelectedFacets((previous) => ({
      ...previous,
      q: searchParams.get('q') ? [decodeURIComponent(searchParams.get('q') || '')] : [],
      ...(contentParam !== null && {
        content: contentParam ? contentParam.split(',').filter(Boolean) : [],
      }),
      // Both deep-link params feed the one Access facet (terms Enrolled /
      // Recommended).
      ...((enrolledParam !== null || recommendedParam !== null) && {
        enrollment: [
          ...(enrolledParam === 'true' ? ['Enrolled'] : []),
          ...(recommendedParam === 'true' ? ['Recommended'] : []),
        ],
      }),
    }));
  }, [searchParams, setSelectedFacets]);

  /** Either user-scoped filter is on — cards come from user endpoints. */
  const userContentOnly = enrolledOnly || recommendedOnly;
  const cardsBusy =
    contentsLoading ||
    (enrolledOnly && enrollmentsLoading) ||
    (recommendedOnly && recommendationsLoading);

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
        <main className="flex flex-1 overflow-hidden">
          {/* Filters Sidebar */}
          <div
            className="hidden w-64 overflow-y-auto border-r border-gray-200 p-6 md:block"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* The page title ("Explore Content") lives in the navbar's left cluster. */}
            <div className="mb-6">
              <DiscoverFacetsFilter />
            </div>
          </div>

          {/* Main Content */}
          <div
            className="flex-1 overflow-y-auto px-3 pt-4 pb-16 sm:px-4 md:px-6 md:pt-6 md:pb-6"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div className="w-full pb-16">
              <div className="mb-4 flex items-center justify-end md:hidden">
                <Button variant="outline" size="sm" onClick={() => setFilterDrawerOpen(true)}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
              {filterDrawerOpen && <DiscoverFilterDrawer />}
              {/* Content Type Filter */}
              {!_.isEmpty(selectedFacets) && (
                <div className="mb-6 flex items-center gap-3">
                  {Object.keys(selectedFacets).map((selectedFacet: string, index: number) => {
                    if (selectedFacets?.[selectedFacet]?.length === 0) {
                      return;
                    }
                    // Chips read as standalone values ("Courses",
                    // "Enrolled", "Recommended") — the term IS the label,
                    // so no facet prefix for these.
                    const hideFacetPrefix =
                      selectedFacet === 'content' || selectedFacet === ENROLLMENT_FACET_SLUG;
                    return (
                      <div
                        key={`selected-facet-${selectedFacet}-${index}`}
                        className="flex items-center rounded-md bg-gray-100 px-3 py-1 text-sm"
                      >
                        {!hideFacetPrefix && (
                          <span className="mr-1 text-gray-600 capitalize">{selectedFacet}:</span>
                        )}
                        {selectedFacets?.[selectedFacet]?.map(
                          (selectedTerm: string, index: number) => (
                            <React.Fragment key={index}>
                              <span className="ml-1 text-gray-600 capitalize">{selectedTerm}</span>
                              <button
                                onClick={() => handleSelectFacets(selectedFacet, selectedTerm)}
                                className="ml-1 text-gray-400 hover:text-gray-600"
                                aria-label={`Remove filter ${selectedFacet}: ${selectedTerm}`}
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
              {((!cardsBusy && isError && !userContentOnly) ||
                (!cardsBusy && displayCards?.length === 0)) && (
                <DefaultEmptyBox
                  message={
                    enrolledOnly
                      ? 'No enrolled content found.'
                      : recommendedOnly
                        ? 'No recommended content found.'
                        : 'No content found.'
                  }
                />
              )}

              {/* Course Grid */}
              <div className="grid w-full grid-cols-1 gap-4 overflow-hidden min-[450px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {cardsBusy && <SkeletonMultiplier multiplier={10} Skeleton={CourseCardSkeleton} />}
                {!cardsBusy &&
                  displayCards.length > 0 &&
                  displayCards.map((card, index) => (
                    <div key={`content-${card.id || index}`} className="w-full">
                      <DiscoverContentCard content={card} />
                    </div>
                  ))}
              </div>

              {/* Pagination — the user-scoped views list everything at once */}
              <div className={`mt-8 mb-6 ${userContentOnly ? 'hidden' : 'flex'} justify-end`}>
                <AccessiblePaginate
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
          </div>
        </main>
      </FacetFilterContext.Provider>
    </>
  );
}
