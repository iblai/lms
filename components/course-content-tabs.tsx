'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from 'react';

import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Ellipsis, type LucideProps } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * `learn` / `about` tabs are for every learner and sit inline; `teach` tabs
 * are staff-only and always live in the separate Staff tools menu.
 */
export type CourseContentTabGroup = 'learn' | 'teach' | 'about';

export interface CourseContentTab {
  /** Matches the `activeTab` value used by the layout. */
  key: string;
  label: string;
  href: string;
  icon?: ComponentType<LucideProps>;
  group?: CourseContentTabGroup;
  /** Renders a plain anchor opening in a new tab (e.g. Studio authoring). */
  external?: boolean;
}

// Section headings for the overflow menu; the Staff tools menu needs none —
// its trigger already says what it holds.
const GROUP_LABELS: Partial<Record<CourseContentTabGroup, string>> = {
  learn: 'Learn',
  about: 'About this course',
};
const OVERFLOW_GROUP_ORDER: CourseContentTabGroup[] = ['learn', 'about'];

// Shared between the rendered tabs and the hidden measurement row so both
// report identical widths.
// h-7 pills inside a p-0.5 track: the whole row measures h-8, the same as the
// Staff tools button and the unit navigator.
const TAB_CLASS =
  'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors';
const FOCUS_CLASS = 'focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none';
const PILL_ACTIVE_CLASS = 'bg-white text-amber-600 shadow-sm ring-1 ring-gray-200/80';
const PILL_IDLE_CLASS = 'text-gray-600 hover:bg-white/70 hover:text-gray-900';

// Width reserved for the overflow trigger while deciding how many tabs fit.
// Only a fallback — the real trigger is measured once it is on screen.
const OVERFLOW_TRIGGER_WIDTH = 88;
// Horizontal padding of the segmented control wrapping the tabs (`p-0.5`).
const TRACK_INSET = 4;
const MENU_CLASS = 'w-56 border-gray-200 shadow-lg';

const TabContent = ({ tab }: { tab: CourseContentTab }) => {
  const Icon = tab.icon;
  return (
    <>
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      <span>{tab.label}</span>
      {tab.external && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />}
    </>
  );
};

const TabMenuItem = ({ tab, active }: { tab: CourseContentTab; active: boolean }) => {
  const Icon = tab.icon;
  const className = cn(
    'flex items-center gap-2',
    active ? 'font-medium text-amber-600' : 'text-gray-700',
  );
  const iconClassName = cn('h-4 w-4', active ? 'text-amber-600' : 'text-gray-400');
  return (
    <DropdownMenuItem asChild className="cursor-pointer">
      {tab.external ? (
        <a href={tab.href} target="_blank" rel="noopener noreferrer" className={className}>
          {Icon && <Icon className={iconClassName} aria-hidden />}
          <span className="flex-1">{tab.label}</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" aria-hidden />
        </a>
      ) : (
        <Link href={tab.href} aria-current={active ? 'page' : undefined} className={className}>
          {Icon && <Icon className={iconClassName} aria-hidden />}
          <span className="flex-1">{tab.label}</span>
        </Link>
      )}
    </DropdownMenuItem>
  );
};

/**
 * Course content tab bar. Learner tabs sit in a segmented track and collapse
 * into a "More" menu when they don't fit; staff-only tabs are kept apart in a
 * Staff tools menu at the end of the row so learners never see them and staff
 * always find them in one place.
 */
export function CourseContentTabs({
  tabs,
  activeTab,
}: {
  tabs: CourseContentTab[];
  activeTab?: string;
}) {
  const learnerTabs = useMemo(() => tabs.filter((tab) => tab.group !== 'teach'), [tabs]);
  const teachTabs = useMemo(() => tabs.filter((tab) => tab.group === 'teach'), [tabs]);

  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [visibleCount, setVisibleCount] = useState(learnerTabs.length);

  const recalculate = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const available = Math.max(0, container.clientWidth - TRACK_INSET);
    const widths = Array.from(measure.children).map((child) =>
      Math.ceil((child as HTMLElement).getBoundingClientRect().width),
    );
    const total = widths.reduce((sum, width) => sum + width, 0);

    if (total <= available) {
      setVisibleCount(widths.length);
      return;
    }

    const triggerWidth = triggerRef.current
      ? Math.ceil(triggerRef.current.getBoundingClientRect().width)
      : OVERFLOW_TRIGGER_WIDTH;
    const budget = available - triggerWidth;
    let used = 0;
    let count = 0;
    for (const width of widths) {
      if (used + width > budget) break;
      used += width;
      count += 1;
    }
    setVisibleCount(count);
  }, []);

  // Layout effect + ResizeObserver: the track is `flex-1` with hidden
  // overflow, so its width never depends on how many tabs we show — no
  // measure/render feedback loop.
  useLayoutEffect(() => {
    recalculate();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => recalculate());
    observer.observe(container);
    // The measurement row is off-flow, so watching it only reports genuine
    // label/font-metric changes (e.g. a webfont swapping in) — never our own
    // re-renders.
    if (measureRef.current) observer.observe(measureRef.current);
    return () => observer.disconnect();
  }, [recalculate, learnerTabs]);

  const visibleTabs = learnerTabs.slice(0, visibleCount);
  const overflowTabs = learnerTabs.slice(visibleCount);
  const hasOverflow = overflowTabs.length > 0;
  // The first pass budgets the trigger with a fallback width; once it is on
  // screen, measure it for real. Can't loop: with the total over budget at
  // least one tab overflows whatever the trigger measures, so it stays mounted.
  useLayoutEffect(() => {
    if (hasOverflow) recalculate();
  }, [hasOverflow, recalculate]);

  const activeTabHidden = overflowTabs.some((tab) => tab.key === activeTab);
  const teachTabActive = teachTabs.some((tab) => tab.key === activeTab);
  const overflowGroups = OVERFLOW_GROUP_ORDER.map((group) => ({
    group,
    tabs: overflowTabs.filter((tab) => (tab.group ?? 'learn') === group),
  })).filter(({ tabs: groupTabs }) => groupTabs.length > 0);

  const renderTab = (tab: CourseContentTab) => {
    const isActive = tab.key === activeTab;
    const className = cn(TAB_CLASS, FOCUS_CLASS, isActive ? PILL_ACTIVE_CLASS : PILL_IDLE_CLASS);
    if (tab.external) {
      return (
        <a
          key={tab.key}
          href={tab.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          <TabContent tab={tab} />
        </a>
      );
    }
    return (
      <Link
        key={tab.key}
        href={tab.href}
        aria-current={isActive ? 'page' : undefined}
        className={className}
      >
        <TabContent tab={tab} />
      </Link>
    );
  };

  return (
    <div
      data-testid="course-content-tabs"
      className="flex min-w-0 flex-1 items-center justify-between gap-2"
    >
      <div
        ref={containerRef}
        data-testid="course-content-tabs-track"
        className="relative min-w-0 flex-1 overflow-hidden"
      >
        {/* Off-flow copy of every learner tab, used only to measure natural widths. */}
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none invisible absolute top-0 left-0 flex"
        >
          {learnerTabs.map((tab) => (
            <span key={tab.key} className={TAB_CLASS}>
              <TabContent tab={tab} />
            </span>
          ))}
        </div>
        <nav
          aria-label="Course sections"
          className="inline-flex max-w-full items-center rounded-lg bg-gray-100/80 p-0.5"
        >
          {visibleTabs.map(renderTab)}
          {hasOverflow && (
            <DropdownMenu>
              <DropdownMenuTrigger
                ref={triggerRef}
                data-testid="course-tabs-overflow-trigger"
                aria-label="More course tabs"
                className={cn(
                  TAB_CLASS,
                  FOCUS_CLASS,
                  'data-[state=open]:bg-white data-[state=open]:text-gray-900',
                  activeTabHidden ? PILL_ACTIVE_CLASS : PILL_IDLE_CLASS,
                )}
              >
                <Ellipsis className="h-4 w-4" aria-hidden />
                <span>More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={MENU_CLASS}>
                {overflowGroups.map(({ group, tabs: groupTabs }, index) => (
                  <DropdownMenuGroup key={group}>
                    {index > 0 && <DropdownMenuSeparator />}
                    {overflowGroups.length > 1 && (
                      <DropdownMenuLabel className="text-[11px] font-medium tracking-wide text-gray-400 uppercase">
                        {GROUP_LABELS[group]}
                      </DropdownMenuLabel>
                    )}
                    {groupTabs.map((tab) => (
                      <TabMenuItem key={tab.key} tab={tab} active={tab.key === activeTab} />
                    ))}
                  </DropdownMenuGroup>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
      {teachTabs.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            data-testid="course-tabs-staff-trigger"
            aria-label="Staff tools"
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-3 text-sm font-medium whitespace-nowrap transition-colors',
              FOCUS_CLASS,
              'data-[state=open]:bg-gray-50',
              teachTabActive
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100/70'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <span>Staff tools</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={MENU_CLASS}>
            {teachTabs.map((tab) => (
              <TabMenuItem key={tab.key} tab={tab} active={tab.key === activeTab} />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
