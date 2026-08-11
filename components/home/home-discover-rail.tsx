'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { config } from '@/lib/config';
import {
  useDiscover,
  ENROLLMENT_FACET_SLUG,
  ENROLLMENT_FACET_TERM,
  RECOMMENDED_FACET_TERM,
} from '@/hooks/discover/use-discover';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { isDiscoverEnabled } from '@/utils/discover-visibility';
import { DiscoverContentCard } from '@/components/discover-content-card';
import { CourseCardSkeleton } from '@/components/course-card-skeleton';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { NoCoursesEmptyBox } from '@/components/no-courses-empty-box';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import {
  isLoggedIn,
  useTenantMetadata,
  resolveLmsDashboardCoursesDisplay,
  LMS_DASHBOARD_COURSES_DISPLAY_SLUG,
  type LmsDashboardCoursesDisplay,
} from '@iblai/iblai-js/web-utils';

const RAIL_LIMIT = 16;

const GRID_CLASS =
  'grid w-full grid-cols-1 gap-4 min-[450px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';

/**
 * Heading, empty-state copy and "See More" deep link for each value of the
 * `lms_dashboard_courses_display` tenant setting. The Discover page reads
 * `enrolled` / `recommended` back out of the query string, so the rail and
 * the page it links into land on the same filter.
 */
const RAIL_MODES: Record<
  LmsDashboardCoursesDisplay,
  { heading: string; emptyMessage: string; seeMoreQuery: string }
> = {
  catalog: {
    heading: 'Explore',
    emptyMessage: 'No content found.',
    seeMoreQuery: '',
  },
  enrolled: {
    heading: 'My Courses',
    emptyMessage: 'No enrolled content found.',
    seeMoreQuery: '?enrolled=true',
  },
  recommended: {
    heading: 'Recommended for You',
    emptyMessage: 'No recommended content found.',
    seeMoreQuery: '?recommended=true',
  },
};

/**
 * The synthetic Access facet that switches `useDiscover` off the catalog
 * search and onto the user's own endpoints. Catalog mode seeds nothing —
 * it is the hook's default.
 */
const initialFacetsFor = (display: LmsDashboardCoursesDisplay) => {
  switch (display) {
    case 'enrolled':
      return { [ENROLLMENT_FACET_SLUG]: [ENROLLMENT_FACET_TERM] };
    case 'recommended':
      return { [ENROLLMENT_FACET_SLUG]: [RECOMMENDED_FACET_TERM] };
    default:
      return undefined;
  }
};

/**
 * Landing rail into the Discover page, showing whichever set of courses the
 * tenant's `lms_dashboard_courses_display` setting selects — the catalog
 * (default), the user's enrollments, or their recommendations — with a
 * "See More" that carries the same filter into /discover. Hidden when
 * Discover is disabled for the tenant or the catalog request errored.
 */
export function HomeDiscoverRail() {
  const tenant = useTenantParam();
  const { metadata, isLoading: metadataLoading } = useTenantMetadata({ org: tenant });

  const discoverEnabled = isDiscoverEnabled({
    hideDiscoverTab: config.settings.hideDiscoverTab(),
    enableDiscoverPage: metadata?.enable_discover_page,
  });

  if (!discoverEnabled) return null;

  // `useDiscover` seeds its filters once, at mount, so the mode has to be
  // settled before the rail body mounts — otherwise a tenant on "enrolled"
  // would fire a throwaway catalog search first.
  if (metadataLoading) {
    return (
      <section aria-busy="true" className="mb-6 w-full">
        <div className={GRID_CLASS}>
          <SkeletonMultiplier multiplier={RAIL_LIMIT} Skeleton={CourseCardSkeleton} />
        </div>
      </section>
    );
  }

  // Logged-out visitors have neither enrollments nor recommendations, so
  // they always get the catalog regardless of the tenant setting.
  const display = isLoggedIn()
    ? resolveLmsDashboardCoursesDisplay(metadata?.[LMS_DASHBOARD_COURSES_DISPLAY_SLUG])
    : 'catalog';

  // Keyed on the mode: `useDiscover` seeds its filters from `initialFacets`
  // once per mount, so a tenant flipping the setting has to remount the rail
  // to take effect — otherwise it would only change on a page reload.
  return <HomeCoursesRail key={display} tenant={tenant} display={display} />;
}

function HomeCoursesRail({
  tenant,
  display,
}: {
  tenant: string;
  display: LmsDashboardCoursesDisplay;
}) {
  const {
    displayCards,
    contentsLoading,
    facetsLoading,
    isError,
    catalogEmpty,
    enrolledOnly,
    recommendedOnly,
    enrollmentsLoading,
    recommendationsLoading,
  } = useDiscover({
    limit: RAIL_LIMIT,
    initialFacets: initialFacetsFor(display),
  });

  /** Cards come from the user's own endpoints, not the catalog search. */
  const userContentOnly = enrolledOnly || recommendedOnly;
  // `useDiscover` declines a user-scoped mode it can't honour (e.g.
  // recommendations hidden for the deploy) and falls back to the catalog —
  // so read the effective mode back off the hook, not off the setting.
  const mode = RAIL_MODES[recommendedOnly ? 'recommended' : enrolledOnly ? 'enrolled' : 'catalog'];

  const cardsBusy =
    contentsLoading ||
    (enrolledOnly && enrollmentsLoading) ||
    (recommendedOnly && recommendationsLoading);

  // Only catalog mode renders what the search returned, so only it is sunk
  // by a search error.
  if (!cardsBusy && isError && !userContentOnly) return null;

  const cards = (displayCards ?? []).slice(0, RAIL_LIMIT);
  // Wait for the unfiltered catalog probe (`facetsLoading`) before settling
  // on an empty state, so "No enrolled content" never flashes over a
  // catalog that turns out to be empty for everyone.
  const railEmpty = !cardsBusy && !facetsLoading && cards.length === 0;
  /** Nothing exists for any filter — no mode can fill the rail. */
  const nothingAnywhere = railEmpty && (!userContentOnly || catalogEmpty);
  const showSkeletons = cardsBusy || (cards.length === 0 && facetsLoading);

  return (
    <section aria-label={mode.heading} className="mb-6 w-full">
      {/* An empty catalog shows only the no-courses box — no rail chrome. */}
      {!nothingAnywhere && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-600 sm:text-lg md:text-xl">
            {mode.heading}
          </h3>
          <Link
            href={`/platform/${tenant}/discover${mode.seeMoreQuery}`}
            className="flex items-center gap-1 rounded-md px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 sm:text-sm"
          >
            See More
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
      {nothingAnywhere ? (
        <NoCoursesEmptyBox />
      ) : railEmpty ? (
        // The user has none of this content yet, but the catalog does have
        // something — the heading and "See More" above are the way in.
        <DefaultEmptyBox message={mode.emptyMessage} />
      ) : (
        <div className={GRID_CLASS}>
          {showSkeletons && (
            <SkeletonMultiplier multiplier={RAIL_LIMIT} Skeleton={CourseCardSkeleton} />
          )}
          {!showSkeletons &&
            cards.map((card, index) => (
              <div key={`home-discover-${card.id || index}`} className="w-full">
                <DiscoverContentCard content={card} />
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
