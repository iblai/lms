'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface CourseContentTab {
  /** Matches the `activeTab` value used by the layout. */
  key: string;
  label: string;
  href: string;
  /** Renders a plain anchor opening in a new tab (e.g. Studio authoring). */
  external?: boolean;
}

// Shared between the rendered tabs and the hidden measurement row so both
// report identical widths.
const TAB_CLASS = 'shrink-0 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap';

// Width reserved for the overflow trigger while deciding how many tabs fit.
// Only a fallback — the real trigger is measured once it is on screen.
const OVERFLOW_TRIGGER_WIDTH = 40;

/**
 * Course content tab bar that never overlaps the controls sitting next to it:
 * tabs that don't fit the available width collapse into a 3-dot dropdown
 * rendered at the end of the row.
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

    const available = container.clientWidth;
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
  const activeTabHidden = overflowTabs.some((tab) => tab.key === activeTab);

  const renderTab = (tab: CourseContentTab) => {
    const isActive = tab.key === activeTab;
    const className = cn(
      TAB_CLASS,
      isActive
        ? 'border-amber-500 text-amber-600'
        : 'border-transparent text-gray-500 hover:text-gray-700',
    );
    if (tab.external) {
      return (
        <a
          key={tab.key}
          href={tab.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {tab.label}
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
        {tab.label}
      </Link>
    );
  };

  return (
    <div
      ref={containerRef}
      data-testid="course-content-tabs"
      className="relative min-w-0 flex-1 overflow-hidden"
    >
      {/* Off-flow copy of every tab, used only to measure natural widths. */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute top-0 left-0 flex"
      >
        {tabs.map((tab) => (
          <span key={tab.key} className={TAB_CLASS}>
            {tab.label}
          </span>
        ))}
      </div>
      <div className="flex items-center">
        {visibleTabs.map(renderTab)}
        {overflowTabs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              ref={triggerRef}
              data-testid="course-tabs-overflow-trigger"
              aria-label="More course tabs"
              className={cn(
                'shrink-0 border-b-2 px-2 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none focus:ring-inset',
                activeTabHidden
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              <MoreVertical className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {overflowTabs.map((tab) => (
                <DropdownMenuItem key={tab.key} asChild className="cursor-pointer">
                  {tab.external ? (
                    <a href={tab.href} target="_blank" rel="noopener noreferrer">
                      {tab.label}
                    </a>
                  ) : (
                    <Link
                      href={tab.href}
                      aria-current={tab.key === activeTab ? 'page' : undefined}
                      className={cn(tab.key === activeTab && 'font-medium text-amber-600')}
                    >
                      {tab.label}
                    </Link>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
