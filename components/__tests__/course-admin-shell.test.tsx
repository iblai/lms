import { describe, it, expect, vi } from 'vitest';
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
  ArrowUpRight: (props: any) => <span data-testid="icon-external" {...props} />,
}));

import { CourseAdminShell, type CourseAdminSection } from '../course-admin-shell';

const OverviewIcon = (props: any) => <span data-testid="icon-overview" {...props} />;

const sections: CourseAdminSection[] = [
  {
    key: 'instructor:overview',
    label: 'Overview',
    href: '/i?section=overview',
    icon: OverviewIcon,
    scrollsItself: true,
  },
  { key: 'gradebook', label: 'Grades', href: '/gradebook', group: 'learners', scrollsItself: true },
  {
    key: 'instructor:membership',
    label: 'Membership',
    href: '/i?section=membership',
    group: 'learners',
    scrollsItself: true,
  },
  { key: 'analytics', label: 'Analytics', href: '/analytics', group: 'insights' },
  { key: 'configuration', label: 'Settings', href: '/configuration', group: 'course' },
  {
    key: 'authoring',
    label: 'Authoring',
    href: 'https://studio.example.org/course/x',
    group: 'course',
    external: true,
  },
];

describe('CourseAdminShell', () => {
  it('lists the lead section, then the groups in order, with the page inside', () => {
    render(
      <CourseAdminShell sections={sections} activeKey="gradebook">
        <div data-testid="page">page</div>
      </CourseAdminShell>,
    );
    const nav = screen.getByRole('navigation', { name: 'Course admin' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Overview', 'Grades', 'Membership', 'Analytics', 'Settings', 'Authoring']);
    expect(within(nav).getByText('Learners')).toBeInTheDocument();
    expect(within(nav).getByText('Insights')).toBeInTheDocument();
    expect(within(nav).getByText('Course')).toBeInTheDocument();
    expect(within(screen.getByTestId('course-admin-content')).getByTestId('page')).toBeVisible();
  });

  it('omits empty groups', () => {
    render(
      <CourseAdminShell sections={sections.slice(0, 2)} activeKey="gradebook">
        <div />
      </CourseAdminShell>,
    );
    const nav = screen.getByRole('navigation', { name: 'Course admin' });
    expect(within(nav).getByText('Learners')).toBeInTheDocument();
    expect(within(nav).queryByText('Insights')).not.toBeInTheDocument();
    expect(within(nav).queryByText('Course')).not.toBeInTheDocument();
  });

  it('marks the active section, its icon, and nothing else', () => {
    render(
      <CourseAdminShell sections={sections} activeKey="instructor:overview">
        <div />
      </CourseAdminShell>,
    );
    const active = screen.getByRole('link', { name: 'Overview' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active.className).toContain('text-amber-700');
    expect(within(active).getByTestId('icon-overview')).toHaveAttribute('aria-hidden', 'true');
    expect(within(active).getByTestId('icon-overview').className).toContain('text-amber-600');
    const idle = screen.getByRole('link', { name: 'Analytics' });
    expect(idle).not.toHaveAttribute('aria-current');
    expect(idle.className).not.toContain('text-amber-700');
  });

  it('scrolls the active section into view (the mobile strip can start off-screen)', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(
      <CourseAdminShell sections={sections} activeKey="analytics">
        <div />
      </CourseAdminShell>,
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ inline: 'nearest', block: 'nearest' });
  });

  it('opens external sections in a new tab with an outbound marker', () => {
    render(
      <CourseAdminShell sections={sections} activeKey="gradebook">
        <div />
      </CourseAdminShell>,
    );
    const studio = screen.getByRole('link', { name: 'Authoring' });
    expect(studio).toHaveAttribute('target', '_blank');
    expect(studio).toHaveAttribute('href', 'https://studio.example.org/course/x');
    expect(within(studio).getByTestId('icon-external')).toBeInTheDocument();
  });

  it('scrolls the content column only for pages that do not scroll themselves', () => {
    const { rerender } = render(
      <CourseAdminShell sections={sections} activeKey="analytics">
        <div />
      </CourseAdminShell>,
    );
    expect(screen.getByTestId('course-admin-content').className).toContain('overflow-y-auto');

    rerender(
      <CourseAdminShell sections={sections} activeKey="gradebook">
        <div />
      </CourseAdminShell>,
    );
    expect(screen.getByTestId('course-admin-content').className).not.toContain('overflow-y-auto');

    rerender(
      <CourseAdminShell sections={sections}>
        <div />
      </CourseAdminShell>,
    );
    expect(screen.getByTestId('course-admin-content').className).not.toContain('overflow-y-auto');
  });
});
