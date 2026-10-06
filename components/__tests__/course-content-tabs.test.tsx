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
      return this.dataset.testid === 'course-content-tabs-track' ? containerWidth : 0;
    },
  });
}

const track = () => screen.getByTestId('course-content-tabs-track');
const overflowMenu = () => {
  const trigger = screen.getByTestId('course-tabs-overflow-trigger');
  return within(trigger.parentElement as HTMLElement).getByTestId('dropdown-content');
};
const manageMenu = () => {
  const trigger = screen.getByTestId('course-tabs-staff-trigger');
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

describe('CourseContentTabs', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // @ts-expect-error — drop the clientWidth override between tests.
    delete HTMLElement.prototype.clientWidth;
  });

  it('renders every learner tab inline and no overflow menu when they all fit', () => {
    mockLayout(1000);
    render(<CourseContentTabs tabs={tabs} activeTab="course" />);

    expect(inlineTabs()).toEqual(['Agent', 'Course', 'Progress', 'Dates']);
    expect(screen.queryByTestId('course-tabs-overflow-trigger')).not.toBeInTheDocument();
  });

  it('keeps every learner tab inline when jsdom reports no layout at all', () => {
    // No mockLayout: widths and clientWidth are all 0, which must not be read
    // as "nothing fits".
    render(<CourseContentTabs tabs={tabs} activeTab="course" />);

    expect(inlineTabs()).toHaveLength(learnerTabs.length);
    expect(screen.queryByTestId('course-tabs-overflow-trigger')).not.toBeInTheDocument();
  });

  it('moves the learner tabs that do not fit into the overflow menu', () => {
    // 258px − 8px track inset − 40px trigger leaves room for two 100px tabs.
    mockLayout(250 + TRACK_INSET);
    render(<CourseContentTabs tabs={tabs} activeTab="agent" />);

    expect(inlineTabs()).toEqual(['Agent', 'Course']);
    expect(linkNames(overflowMenu())).toEqual(['Progress', 'Dates']);
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

  describe('Staff tools menu (staff tabs)', () => {
    it('keeps staff tabs out of the track and lists them in the Staff tools menu in order', () => {
      mockLayout(1000);
      render(<CourseContentTabs tabs={tabs} activeTab="course" />);

      expect(inlineTabs()).not.toContain('Instructor');
      expect(linkNames(manageMenu())).toEqual(['Instructor', 'Gradebook', 'Authoring']);
      // No heading: the trigger label already says what the menu holds.
      expect(within(manageMenu()).queryByTestId('dropdown-label')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Staff tools' })).toHaveTextContent('Staff tools');
    });

    it('is not rendered at all for a learner with no staff tabs', () => {
      mockLayout(1000);
      render(<CourseContentTabs tabs={learnerTabs} activeTab="course" />);

      expect(screen.queryByTestId('course-tabs-staff-trigger')).not.toBeInTheDocument();
    });

    it('highlights the trigger and the entry while a staff page is open', () => {
      mockLayout(1000);
      const { rerender } = render(<CourseContentTabs tabs={tabs} activeTab="gradebook" />);

      expect(screen.getByTestId('course-tabs-staff-trigger').className).toContain('text-amber-700');
      const gradebook = within(manageMenu()).getByRole('link', { name: 'Gradebook' });
      expect(gradebook).toHaveAttribute('aria-current', 'page');
      expect(gradebook.className).toContain('text-amber-600');

      rerender(<CourseContentTabs tabs={tabs} activeTab="course" />);
      expect(screen.getByTestId('course-tabs-staff-trigger').className).toContain('text-gray-700');
      expect(within(manageMenu()).getByRole('link', { name: 'Gradebook' })).not.toHaveAttribute(
        'aria-current',
      );
    });

    it('keeps external staff tabs opening in a new tab from the Staff tools menu', () => {
      mockLayout(1000);
      render(<CourseContentTabs tabs={tabs} activeTab="course" />);

      const authoring = within(manageMenu()).getByRole('link', { name: 'Authoring' });
      expect(authoring).toHaveAttribute('target', '_blank');
      expect(authoring).toHaveAttribute('href', 'https://studio.example.org/course/x');
      expect(within(authoring).getByTestId('icon-external')).toBeInTheDocument();
    });

    it('does not count staff tabs when deciding what overflows', () => {
      // Four 100px learner tabs fit in 408px; the three staff tabs must not push
      // any of them into the More menu.
      mockLayout(400 + TRACK_INSET);
      render(<CourseContentTabs tabs={tabs} activeTab="course" />);

      expect(inlineTabs()).toEqual(['Agent', 'Course', 'Progress', 'Dates']);
      expect(screen.queryByTestId('course-tabs-overflow-trigger')).not.toBeInTheDocument();
      expect(screen.getByTestId('course-tabs-staff-trigger')).toBeInTheDocument();
    });
  });
});
