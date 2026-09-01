import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('lucide-react', () => ({
  MoreVertical: (props: any) => <span data-testid="icon-more" {...props} />,
}));

// Radix's menu primitives need pointer-capture APIs jsdom lacks, so they are
// stubbed down to the bits this component drives. The content is always
// rendered here; real open/close interaction is covered by the e2e journeys.
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="overflow-content">{children}</div>,
  DropdownMenuItem: ({ children, asChild, ...props }: any) => <div {...props}>{children}</div>,
}));

import { CourseContentTabs, type CourseContentTab } from '../course-content-tabs';

const TAB_WIDTH = 100;
const TRIGGER_WIDTH = 40;

const tabs: CourseContentTab[] = [
  { key: 'agent', label: 'Agent', href: '/agent' },
  { key: 'course', label: 'Course', href: '/course' },
  { key: 'progress', label: 'Progress', href: '/progress' },
  { key: 'dates', label: 'Dates', href: '/dates' },
  {
    key: 'authoring',
    label: 'Authoring',
    href: 'https://studio.example.org/course/x',
    external: true,
  },
];

/** Give jsdom (which has no layout) deterministic tab / container widths. */
function mockLayout(containerWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const width =
      this.dataset.testid === 'course-tabs-overflow-trigger' ? TRIGGER_WIDTH : TAB_WIDTH;
    return { width, height: 40, top: 0, left: 0, right: width, bottom: 40, x: 0, y: 0 } as DOMRect;
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset.testid === 'course-content-tabs' ? containerWidth : 0;
    },
  });
}

const inlineTabs = () => {
  const container = screen.getByTestId('course-content-tabs');
  const overflow = screen.queryByTestId('overflow-content');
  return within(container)
    .getAllByRole('link')
    .filter((link) => !overflow?.contains(link))
    .map((link) => link.textContent);
};

describe('CourseContentTabs', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // @ts-expect-error — drop the clientWidth override between tests.
    delete HTMLElement.prototype.clientWidth;
  });

  it('renders every tab inline and no overflow menu when they all fit', () => {
    mockLayout(1000);
    render(<CourseContentTabs tabs={tabs} activeTab="course" />);

    expect(inlineTabs()).toEqual(['Agent', 'Course', 'Progress', 'Dates', 'Authoring']);
    expect(screen.queryByTestId('course-tabs-overflow-trigger')).not.toBeInTheDocument();
  });

  it('moves the tabs that do not fit into the overflow menu', () => {
    // 250px − 40px trigger leaves room for two 100px tabs.
    mockLayout(250);
    render(<CourseContentTabs tabs={tabs} activeTab="agent" />);

    expect(inlineTabs()).toEqual(['Agent', 'Course']);

    const overflow = screen.getByTestId('overflow-content');
    expect(
      within(overflow)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Progress', 'Dates', 'Authoring']);
    expect(screen.getByTestId('course-tabs-overflow-trigger')).toBeInTheDocument();
  });

  it('marks the overflow trigger active while the current tab is hidden', () => {
    mockLayout(250);
    const { rerender } = render(<CourseContentTabs tabs={tabs} activeTab="dates" />);

    const trigger = screen.getByTestId('course-tabs-overflow-trigger');
    expect(trigger.className).toContain('text-amber-600');

    rerender(<CourseContentTabs tabs={tabs} activeTab="agent" />);
    expect(screen.getByTestId('course-tabs-overflow-trigger').className).toContain('text-gray-500');
  });

  it('keeps external tabs opening in a new tab from the overflow menu', () => {
    mockLayout(250);
    render(<CourseContentTabs tabs={tabs} activeTab="agent" />);

    const authoring = within(screen.getByTestId('overflow-content')).getByRole('link', {
      name: 'Authoring',
    });
    expect(authoring).toHaveAttribute('target', '_blank');
    expect(authoring).toHaveAttribute('href', 'https://studio.example.org/course/x');
  });

  it('highlights the active tab that is rendered inline', () => {
    mockLayout(1000);
    render(<CourseContentTabs tabs={tabs} activeTab="progress" />);

    const active = screen.getByRole('link', { name: 'Progress' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active.className).toContain('border-amber-500');
  });
});
