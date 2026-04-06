'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FacetFilterContext } from '@/contexts/facet-filter-context';
import { useContext } from 'react';
import { DiscoverFacetsFilter } from './discover-facets-filter';

export function DiscoverFilterDrawer() {
  const { filterDrawerOpen, setFilterDrawerOpen } = useContext(FacetFilterContext);
  return (
    <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-gray-200 p-4">
          <SheetTitle className="text-left font-semibold text-gray-800">Explore Content</SheetTitle>
        </SheetHeader>
        <div
          className="flex-1 overflow-y-auto p-6 pb-16"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <DiscoverFacetsFilter />
        </div>
      </SheetContent>
    </Sheet>
  );
}
