'use client';

import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';

import { config } from '@/lib/config';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { isDiscoverEnabled } from '@/utils/discover-visibility';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

/**
 * Landing hero: a greeting and the two primary jumping-off points — the
 * Discover catalog and the learner's own courses.
 */
export function HomeHero() {
  const tenant = useTenantParam();
  const { metadata } = useTenantMetadata({ org: tenant });

  const discoverEnabled = isDiscoverEnabled({
    hideDiscoverTab: config.settings.hideDiscoverTab(),
    enableDiscoverPage: metadata?.enable_discover_page,
  });

  return (
    // Full-bleed band — spans the whole content width, no side margins.
    <section
      aria-label="Welcome"
      className="w-full border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-white px-4 py-6 sm:px-6 sm:py-8 md:px-8"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">Welcome back 👋</h1>
          <p className="mt-1.5 max-w-xl text-sm text-gray-500 sm:text-base">
            Pick up where you left off, or discover something new to grow your skills today.
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
