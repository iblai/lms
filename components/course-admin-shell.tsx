'use client';

import { useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, type LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CourseAdminGroup = 'learners' | 'insights' | 'course';

export interface CourseAdminSection {
  key: string;
  label: string;
  href: string;
  icon?: ComponentType<LucideProps>;
  /** Sections without a group lead the nav (Overview). */
  group?: CourseAdminGroup;
  /** Opens in a new tab (Studio, the legacy proctoring page). */
  external?: boolean;
  /** The section's page scrolls itself (pinned header, own table scroll). */
  scrollsItself?: boolean;
}

const GROUP_LABELS: Record<CourseAdminGroup, string> = {
  learners: 'Learners',
  insights: 'Insights',
  course: 'Course',
};
const GROUP_ORDER: CourseAdminGroup[] = ['learners', 'insights', 'course'];

const SectionLink = ({ section, active }: { section: CourseAdminSection; active: boolean }) => {
  const Icon = section.icon;
  // On mobile the nav is a horizontal strip, so bring the active pill into view.
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' });
  }, [active]);
  // Pill on mobile (h-8, in a horizontal strip), full-width row in the sidebar.
  // The nav shares the tab row's gutter; px-3.5 puts the icon on the same
  // vertical line as the tab icons (tab pill px-3 inside the track's p-0.5).
  const className = cn(
    'flex h-8 shrink-0 items-center gap-2 rounded-md px-3.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none md:h-auto md:py-1.5',
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
 * The course admin area: every staff page behind one tab, with a grouped
 * section nav (sidebar on md+, pill strip on mobile) around the page being
 * viewed. The pages keep their own routes; this only frames them.
 */
export function CourseAdminShell({
  sections,
  activeKey,
  children,
}: {
  sections: CourseAdminSection[];
  activeKey?: string;
  children: ReactNode;
}) {
  const active = sections.find((section) => section.key === activeKey);
  const lead = sections.filter((section) => !section.group);
  const groups = GROUP_ORDER.map((group) => ({
    group,
    sections: sections.filter((section) => section.group === group),
  })).filter(({ sections: groupSections }) => groupSections.length > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row" data-testid="course-admin-shell">
      <aside className="shrink-0 border-b border-gray-200 bg-white md:w-56 md:border-r md:border-b-0">
        <nav
          aria-label="Course admin"
          data-testid="course-admin-nav"
          className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-col md:px-4 md:py-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {lead.map((section) => (
            <SectionLink key={section.key} section={section} active={section.key === activeKey} />
          ))}
          {groups.map(({ group, sections: groupSections }) => (
            <div key={group} className="contents md:mt-3 md:block">
              <p className="hidden px-3.5 pb-1 text-[11px] font-medium tracking-wide text-gray-500 uppercase md:block">
                {GROUP_LABELS[group]}
              </p>
              {groupSections.map((section) => (
                <SectionLink
                  key={section.key}
                  section={section}
                  active={section.key === activeKey}
                />
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col',
          active && !active.scrollsItself && 'overflow-y-auto',
        )}
        style={{ scrollbarWidth: 'none' }}
        data-testid="course-admin-content"
      >
        {children}
      </div>
    </div>
  );
}
