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
  Ellipsis: (props: any) => <span data-testid="icon-more" {...props} />,
  ArrowUpRight: (props: any) => <span data-testid="icon-external" {...props} />,
  ChevronDown: (props: any) => <span data-testid="icon-chevron" {...props} />,
}));

// Radix's menu primitives need pointer-capture APIs jsdom lacks, so they are
// stubbed down to the bits this component drives. The content is always
// rendered here; real open/close interaction is covered by the e2e journeys.
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown">{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, asChild, ...props }: any) => <div {...props}>{children}</div>,
  DropdownMenuGroup: ({ children }: any) => <div data-testid="dropdown-group">{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div data-testid="dropdown-label">{children}</div>,
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
}));

import { CourseContentTabs, type CourseContentTab } from '../course-content-tabs';

const TAB_WIDTH = 100;
const TRIGGER_WIDTH = 40;
// Matches the `p-0.5` inset of the segmented track the component subtracts.
const TRACK_INSET = 4;

const AgentIcon = (props: any) => <span data-testid="icon-agent" {...props} />;
const CourseIcon = (props: any) => <span data-testid="icon-course" {...props} />;

const learnerTabs: CourseContentTab[] = [
  { key: 'agent', label: 'Agent', href: '/agent', icon: AgentIcon, group: 'learn' },
  { key: 'course', label: 'Course', href: '/course', icon: CourseIcon, group: 'learn' },
  { key: 'progress', label: 'Progress', href: '/progress', group: 'learn' },
  { key: 'dates', label: 'Dates', href: '/dates' },
];
const aboutTab: CourseContentTab = {
  key: 'instructors',
  label: 'Instructors',
  href: '/instructors',
  group: 'about',
};
const staffTabs: CourseContentTab[] = [
  { key: 'instructor', label: 'Instructor', href: '/instructor', group: 'teach' },
  { key: 'gradebook', label: 'Gradebook', href: '/gradebook', group: 'teach' },
  {
    key: 'authoring',
    label: 'Authoring',
    href: 'https://studio.example.org/course/x',
    group: 'teach',
    external: true,
  },
];
const tabs = [...learnerTabs, ...staffTabs];

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

const track = () => screen.getByTestId('course-content-tabs');
const overflowMenu = () => {
  const trigger = screen.getByTestId('course-tabs-overflow-trigger');
  return within(trigger.parentElement as HTMLElement).getByTestId('dropdown-content');
};
const linkNames = (scope: HTMLElement) =>
  within(scope)
    .getAllByRole('link')
    .map((link) => link.textContent);
const inlineTabs = () => {
  const menus = within(track()).queryAllByTestId('dropdown-content');
  return within(track())
    .getAllByRole('link')
    .filter((link) => !menus.some((menu) => menu.contains(link)))
    .map((link) => link.textContent);
};
/** The visible divider (the measurement row's copy is aria-hidden). */
const visibleDividers = () =>
  within(track())
    .queryAllByTestId('course-tabs-staff-divider')
    .filter((divider) => !divider.closest('[aria-hidden="true"]'));

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

    expect(inlineTabs()).toEqual([
      'Agent',
      'Course',
      'Progress',
      'Dates',
      'Instructor',
      'Gradebook',
      'Authoring',
    ]);
    expect(screen.queryByTestId('course-tabs-overflow-trigger')).not.toBeInTheDocument();
  });

  it('keeps every tab inline when jsdom reports no layout at all', () => {
    // No mockLayout: widths and clientWidth are all 0, which must not be read
    // as "nothing fits".
    render(<CourseContentTabs tabs={tabs} activeTab="course" />);

    expect(inlineTabs()).toHaveLength(tabs.length);
    expect(screen.queryByTestId('course-tabs-overflow-trigger')).not.toBeInTheDocument();
  });

  it('moves the tabs that do not fit into the overflow menu', () => {
    // 254px − 4px track inset − 40px trigger leaves room for two 100px tabs.
    mockLayout(250 + TRACK_INSET);
    render(<CourseContentTabs tabs={tabs} activeTab="agent" />);

    expect(inlineTabs()).toEqual(['Agent', 'Course']);
    expect(linkNames(overflowMenu())).toEqual([
      'Progress',
      'Dates',
      'Instructor',
      'Gradebook',
      'Authoring',
    ]);
  });

  it('renders the tab icon next to its label, hidden from assistive tech', () => {
    mockLayout(1000);
    render(<CourseContentTabs tabs={tabs} activeTab="agent" />);

    const agent = screen.getByRole('link', { name: 'Agent' });
    expect(within(agent).getByTestId('icon-agent')).toHaveAttribute('aria-hidden', 'true');
    // Tabs without an icon still render just their label.
    expect(screen.getByRole('link', { name: 'Progress' }).textContent).toBe('Progress');
  });

  it('marks an external learner tab with an outbound arrow and opens it in a new tab', () => {
    mockLayout(1000);
    const syllabus: CourseContentTab = {
      key: 'syllabus',
      label: 'Syllabus',
      href: 'https://files.example.org/syllabus.pdf',
      group: 'about',
      external: true,
    };
    render(<CourseContentTabs tabs={[...learnerTabs, syllabus]} activeTab="agent" />);

    const link = screen.getByRole('link', { name: 'Syllabus' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(within(link).getByTestId('icon-external')).toBeInTheDocument();
    expect(
      within(screen.getByRole('link', { name: 'Course' })).queryByTestId('icon-external'),
    ).toBe(null);
  });

  it('groups the overflow menu by section, with labels only when more than one section overflows', () => {
    mockLayout(250 + TRACK_INSET);
    render(<CourseContentTabs tabs={[...learnerTabs, aboutTab]} activeTab="agent" />);

    const menu = overflowMenu();
    expect(
      within(menu)
        .getAllByTestId('dropdown-label')
        .map((l) => l.textContent),
    ).toEqual(['Learn', 'About this course']);
    expect(within(menu).getAllByTestId('dropdown-separator')).toHaveLength(1);

    const [learn, about] = within(menu).getAllByTestId('dropdown-group');
    expect(linkNames(learn)).toEqual(['Progress', 'Dates']);
    expect(linkNames(about)).toEqual(['Instructors']);
  });

  it('omits the section label when every overflowed tab belongs to one section', () => {
    // 358px − 8px − 40px fits three of the four Learn tabs; only Dates overflows.
    mockLayout(350 + TRACK_INSET);
    render(<CourseContentTabs tabs={learnerTabs} activeTab="agent" />);

    const menu = overflowMenu();
    expect(within(menu).queryByTestId('dropdown-label')).not.toBeInTheDocument();
    expect(linkNames(menu)).toEqual(['Dates']);
  });

  it('marks the overflow trigger active while the current tab is hidden', () => {
    mockLayout(250 + TRACK_INSET);
    const { rerender } = render(<CourseContentTabs tabs={tabs} activeTab="dates" />);

    const trigger = screen.getByTestId('course-tabs-overflow-trigger');
    expect(trigger.className).toContain('text-amber-600');
    expect(trigger).toHaveTextContent('More');

    rerender(<CourseContentTabs tabs={tabs} activeTab="agent" />);
    expect(screen.getByTestId('course-tabs-overflow-trigger').className).toContain('text-gray-600');
  });

  it('highlights the active entry inside the overflow menu', () => {
    mockLayout(250 + TRACK_INSET);
    render(<CourseContentTabs tabs={tabs} activeTab="dates" />);

    const menu = overflowMenu();
    const dates = within(menu).getByRole('link', { name: 'Dates' });
    expect(dates).toHaveAttribute('aria-current', 'page');
    expect(dates.className).toContain('text-amber-600');
    expect(within(menu).getByRole('link', { name: 'Progress' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('highlights the active tab that is rendered inline', () => {
    mockLayout(1000);
    render(<CourseContentTabs tabs={tabs} activeTab="progress" />);

    const active = screen.getByRole('link', { name: 'Progress' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active.className).toContain('text-amber-600');
    expect(screen.getByRole('link', { name: 'Agent' })).not.toHaveAttribute('aria-current');
  });

  describe('staff divider', () => {
    it('separates the staff tabs from the learner tabs in the row', () => {
      mockLayout(1000);
      render(<CourseContentTabs tabs={tabs} activeTab="course" />);

      const [divider] = visibleDividers();
      expect(visibleDividers()).toHaveLength(1);
      expect(divider).toHaveAttribute('role', 'separator');
      // Sits right before the first staff tab.
      expect(divider.nextElementSibling).toHaveTextContent('Instructor');
      expect(divider.previousElementSibling).toHaveTextContent('Dates');
    });

    it('is not rendered for a learner with no staff tabs', () => {
      mockLayout(1000);
      render(<CourseContentTabs tabs={learnerTabs} activeTab="course" />);

      expect(visibleDividers()).toHaveLength(0);
    });

    it('leaves the row together with the first staff tab when that overflows', () => {
      // 454px − 4px − 40px fits four 100px tabs: every learner tab stays, every
      // staff tab (and with it the divider) goes into the menu.
      mockLayout(450 + TRACK_INSET);
      render(<CourseContentTabs tabs={tabs} activeTab="course" />);

      expect(inlineTabs()).toEqual(['Agent', 'Course', 'Progress', 'Dates']);
      expect(visibleDividers()).toHaveLength(0);
      expect(linkNames(overflowMenu())).toEqual(['Instructor', 'Gradebook', 'Authoring']);
    });

    it('keeps the external staff tab opening in a new tab inline and from the menu', () => {
      mockLayout(1000);
      const { unmount } = render(<CourseContentTabs tabs={tabs} activeTab="course" />);
      const inline = screen.getByRole('link', { name: 'Authoring' });
      expect(inline).toHaveAttribute('target', '_blank');
      expect(within(inline).getByTestId('icon-external')).toBeInTheDocument();
      unmount();

      mockLayout(250 + TRACK_INSET);
      render(<CourseContentTabs tabs={tabs} activeTab="course" />);
      const inMenu = within(overflowMenu()).getByRole('link', { name: 'Authoring' });
      expect(inMenu).toHaveAttribute('target', '_blank');
      expect(inMenu).toHaveAttribute('href', 'https://studio.example.org/course/x');
    });
  });
});
