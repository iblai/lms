'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Compass } from 'lucide-react';

import { config } from '@/lib/config';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { isDiscoverEnabled } from '@/utils/discover-visibility';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

/** Time-of-day greeting from the browser clock. */
const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

/** Shown when the tenant sets no `skills_welcome_tagline` metadata. */
const DEFAULT_TAGLINE = 'Pick up where you left off or learn something new.';

/**
 * Landing hero: a greeting and the two primary jumping-off points — the
 * Discover catalog and the learner's own courses.
 */
export function HomeHero() {
  const tenant = useTenantParam();
  const { metadata } = useTenantMetadata({ org: tenant });
  // Resolved on the client after mount — the server doesn't know the
  // browser's local time, and rendering it there would break hydration.
  const [greeting, setGreeting] = useState('Welcome back');
  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

  const discoverEnabled = isDiscoverEnabled({
    hideDiscoverTab: config.settings.hideDiscoverTab(),
    enableDiscoverPage: metadata?.enable_discover_page,
  });

  // Tenant-configurable tagline next to the greeting.
  const tagline = (metadata as any)?.skills_welcome_tagline || DEFAULT_TAGLINE;

  return (
    // Full-bleed band — spans the whole content width, no side margins.
    <section
      aria-label="Welcome"
      className="w-full border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-white px-4 py-6 sm:px-6 sm:py-8 md:pr-6 md:pl-5"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        {/* Stacked on mobile; greeting + description side by side
            (vertically centered, left-aligned) on desktop */}
        <div className="min-w-0 md:flex md:items-center md:gap-6">
          <h1 className="shrink-0 text-xl font-semibold text-gray-800 sm:text-2xl">
            {greeting} 👋
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-gray-500 sm:text-base md:mt-0 md:truncate">
            {tagline}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {discoverEnabled && (
            <Link
              href={`/platform/${tenant}/discover`}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-sm font-medium text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
            >
              <Compass className="h-4 w-4" aria-hidden />
              Explore Catalog
            </Link>
          )}
          <Link
            href={`/platform/${tenant}/discover?content=courses&enrolled=true`}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            My Courses
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
