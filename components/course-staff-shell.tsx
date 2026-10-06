'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { CourseContentTab } from '@/components/course-content-tabs';
import { cn } from '@/lib/utils';

/** Sections that render long native pages and need their column to scroll. */
const SCROLLING_SECTIONS = new Set(['analytics', 'configuration', 'instructor']);

const SectionLink = ({ section, active }: { section: CourseContentTab; active: boolean }) => {
  const Icon = section.icon;
  // On mobile the nav is a horizontal strip, so bring the active pill into view.
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' });
  }, [active]);
  // Pill on mobile (h-8, in a horizontal strip), full-width row in the sidebar.
  const className = cn(
    'flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none md:h-auto md:py-2',
    active ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  );
  const content = (
    <>
      {Icon && (
        <Icon
          className={cn('h-4 w-4 shrink-0', active ? 'text-amber-600' : 'text-gray-400')}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1 truncate">{section.label}</span>
      {section.external && (
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
      )}
    </>
  );
  if (section.external) {
    return (
      <a
        ref={ref}
        href={section.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }
  return (
    <Link
      ref={ref}
      href={section.href}
      aria-current={active ? 'page' : undefined}
      className={className}
    >
      {content}
    </Link>
  );
};

/**
 * Staff area of the course: one place for every staff-only page, with a
 * section nav (sidebar on md+, pills on mobile) around the page being viewed.
 * The pages keep their own routes; this only frames them.
 */
export function CourseStaffShell({
  sections,
  activeKey,
  children,
}: {
  sections: CourseContentTab[];
  activeKey?: string;
  children: ReactNode;
}) {
  const scrolls = !!activeKey && SCROLLING_SECTIONS.has(activeKey);
  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row" data-testid="course-staff-shell">
      <aside className="shrink-0 border-b border-gray-200 bg-white md:w-56 md:border-r md:border-b-0">
        <nav
          aria-label="Admin"
          data-testid="course-staff-nav"
          className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-col md:py-4"
          style={{ scrollbarWidth: 'none' }}
        >
          <p className="hidden px-3 pb-2 text-[11px] font-medium tracking-wide text-gray-500 uppercase md:block">
            Admin
          </p>
          {sections.map((section) => (
            <SectionLink key={section.key} section={section} active={section.key === activeKey} />
          ))}
        </nav>
      </aside>
      <div
        className={cn('flex min-h-0 min-w-0 flex-1 flex-col', scrolls && 'overflow-y-auto')}
        style={{ scrollbarWidth: 'none' }}
        data-testid="course-staff-content"
      >
        {children}
      </div>
    </div>
  );
}
