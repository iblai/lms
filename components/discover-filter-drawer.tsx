'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FacetFilterContext } from '@/contexts/facet-filter-context';
import { useContext } from 'react';
import { DiscoverFacetsFilter } from './discover-facets-filter';

export function DiscoverFilterDrawer() {
  const { filterDrawerOpen, setFilterDrawerOpen } = useContext(FacetFilterContext);
  return (
    <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-gray-200 flex flex-row items-center justify-between">
          <SheetTitle className="font-semibold text-gray-800 text-left">Explore Content</SheetTitle>
        </SheetHeader>
        <div
          className="overflow-y-auto flex-1 p-6 pb-16"
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
