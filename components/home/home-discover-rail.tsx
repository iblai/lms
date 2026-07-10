'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { config } from '@/lib/config';
import { useDiscover } from '@/hooks/discover/use-discover';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { isDiscoverEnabled } from '@/utils/discover-visibility';
import { DiscoverContentCard } from '@/components/discover-content-card';
import { CourseCardSkeleton } from '@/components/course-card-skeleton';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

const RAIL_LIMIT = 8;

/**
 * Landing rail over the Discover page's personalized-catalog endpoint:
 * a first taste of the catalog with a "See More" into /discover. Hidden
 * when Discover is disabled for the tenant, or when there is nothing to
 * show.
 */
export function HomeDiscoverRail() {
  const tenant = useTenantParam();
  const { metadata } = useTenantMetadata({ org: tenant });
  const { contents, contentsLoading, isError, handleFormatContents } = useDiscover({
    limit: RAIL_LIMIT,
  });

  const discoverEnabled = isDiscoverEnabled({
    hideDiscoverTab: config.settings.hideDiscoverTab(),
    enableDiscoverPage: metadata?.enable_discover_page,
  });

  if (!discoverEnabled) return null;
  // A landing rail is an invitation, not a report — hide it entirely when
  // the catalog has nothing to offer instead of showing an empty box.
  if (!contentsLoading && (isError || !contents || contents.length === 0)) return null;

  return (
    <section aria-label="Explore the Catalog" className="mb-6 w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-600 sm:text-lg md:text-xl">
          Explore the Catalog
        </h3>
        <Link
          href={`/platform/${tenant}/discover`}
          className="flex items-center gap-1 rounded-md px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 sm:text-sm"
        >
          See More
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid w-full grid-cols-1 gap-4 min-[450px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {contentsLoading && (
          <SkeletonMultiplier multiplier={RAIL_LIMIT} Skeleton={CourseCardSkeleton} />
        )}
        {!contentsLoading &&
          contents.slice(0, RAIL_LIMIT).map((content, index) => (
            <div key={`home-discover-${index}`} className="w-full">
              <DiscoverContentCard content={handleFormatContents(content)} />
            </div>
          ))}
      </div>
    </section>
  );
}
