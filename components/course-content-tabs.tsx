'use client';

import { useCallback, useLayoutEffect, useRef, useState, type ComponentType } from 'react';

import Link from 'next/link';
import { ArrowUpRight, Ellipsis, type LucideProps } from 'lucide-react';
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
 * `learn` / `about` tabs are for every learner; `teach` tabs are staff-only
 * and sit after a divider at the end of the row.
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

const GROUP_LABELS: Record<CourseContentTabGroup, string> = {
  learn: 'Learn',
  about: 'About this course',
  teach: 'Admin',
};
const GROUP_ORDER: CourseContentTabGroup[] = ['learn', 'about', 'teach'];

// Shared between the rendered tabs and the hidden measurement row so both
// report identical widths. h-7 pills inside a p-0.5 track: the whole row
// measures h-8, the same as the unit navigator.
const TAB_CLASS =
  'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors';
const FOCUS_CLASS = 'focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none';
const PILL_ACTIVE_CLASS = 'bg-white text-amber-600 shadow-sm ring-1 ring-gray-200/80';
const PILL_IDLE_CLASS = 'text-gray-600 hover:bg-white/70 hover:text-gray-900';
const MENU_CLASS = 'w-56 border-gray-200 shadow-lg';

// Width reserved for the overflow trigger while deciding how many tabs fit.
// Only a fallback — the real trigger is measured once it is on screen.
const OVERFLOW_TRIGGER_WIDTH = 88;
// Horizontal padding of the segmented control wrapping the tabs (`p-0.5`).
const TRACK_INSET = 4;

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

/** Marks where the learner tabs end and the staff tabs begin. */
const StaffDivider = () => (
  <span
    role="separator"
    aria-orientation="vertical"
    data-testid="course-tabs-staff-divider"
    className="mx-1.5 h-4 w-px shrink-0 bg-gray-300"
  />
);

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
 * Course content tab bar: a segmented track that never overlaps whatever sits
 * next to it — tabs that don't fit collapse into a "More" menu, grouped by
 * section. Staff tabs follow the learner tabs behind a divider.
 */
export function CourseContentTabs({
  tabs,
  activeTab,
}: {
  tabs: CourseContentTab[];
  activeTab?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [visibleCount, setVisibleCount] = useState(tabs.length);

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

  // Layout effect + ResizeObserver: the container is `flex-1` with hidden
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
  }, [recalculate, tabs]);

  const visibleTabs = tabs.slice(0, visibleCount);
  const overflowTabs = tabs.slice(visibleCount);
  const hasOverflow = overflowTabs.length > 0;
  // The first pass budgets the trigger with a fallback width; once it is on
  // screen, measure it for real. Can't loop: with the total over budget at
  // least one tab overflows whatever the trigger measures, so it stays mounted.
  useLayoutEffect(() => {
    if (hasOverflow) recalculate();
  }, [hasOverflow, recalculate]);

  const activeTabHidden = overflowTabs.some((tab) => tab.key === activeTab);
  const overflowGroups = GROUP_ORDER.map((group) => ({
    group,
    tabs: overflowTabs.filter((tab) => (tab.group ?? 'learn') === group),
  })).filter(({ tabs: groupTabs }) => groupTabs.length > 0);

  // The divider belongs to the first staff tab that follows a learner tab, so
  // it is measured with that tab and leaves the row with it.
  const hasDividerBefore = (index: number) =>
    index > 0 && tabs[index].group === 'teach' && tabs[index - 1].group !== 'teach';

  const renderTab = (tab: CourseContentTab, index: number) => {
    const isActive = tab.key === activeTab;
    const className = cn(TAB_CLASS, FOCUS_CLASS, isActive ? PILL_ACTIVE_CLASS : PILL_IDLE_CLASS);
    const divider = hasDividerBefore(index) ? <StaffDivider key={`${tab.key}-divider`} /> : null;
    const link = tab.external ? (
      <a
        key={tab.key}
        href={tab.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <TabContent tab={tab} />
      </a>
    ) : (
      <Link
        key={tab.key}
        href={tab.href}
        aria-current={isActive ? 'page' : undefined}
        className={className}
      >
        <TabContent tab={tab} />
      </Link>
    );
    return [divider, link];
  };

  return (
    <div
      ref={containerRef}
      data-testid="course-content-tabs"
      className="relative min-w-0 flex-1 overflow-hidden"
    >
      {/* Off-flow copy of every tab (divider included), used only to measure natural widths. */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute top-0 left-0 flex"
      >
        {tabs.map((tab, index) => (
          <span key={tab.key} className="inline-flex items-center">
            {hasDividerBefore(index) && <StaffDivider />}
            <span className={TAB_CLASS}>
              <TabContent tab={tab} />
            </span>
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
  );
}
