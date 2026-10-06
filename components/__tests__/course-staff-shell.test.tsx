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

import { CourseStaffShell } from '../course-staff-shell';
import type { CourseContentTab } from '../course-content-tabs';

const DashboardIcon = (props: any) => <span data-testid="icon-dashboard" {...props} />;

const sections: CourseContentTab[] = [
  {
    key: 'instructor',
    label: 'Instructor Dashboard',
    href: '/instructor',
    icon: DashboardIcon,
    group: 'teach',
  },
  { key: 'gradebook', label: 'Gradebook', href: '/gradebook', group: 'teach' },
  { key: 'analytics', label: 'Analytics', href: '/analytics', group: 'teach' },
  {
    key: 'authoring',
    label: 'Edit in Studio',
    href: 'https://studio.example.org/course/x',
    group: 'teach',
    external: true,
  },
];

describe('CourseStaffShell', () => {
  it('lists every section in the nav, in order, and renders the page inside', () => {
    render(
      <CourseStaffShell sections={sections} activeKey="gradebook">
        <div data-testid="page">page</div>
      </CourseStaffShell>,
    );

    const nav = screen.getByRole('navigation', { name: 'Admin' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Instructor Dashboard', 'Gradebook', 'Analytics', 'Edit in Studio']);
    expect(within(screen.getByTestId('course-staff-content')).getByTestId('page')).toBeVisible();
  });

  it('scrolls the active section into view (the mobile strip can start off-screen)', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(
      <CourseStaffShell sections={sections} activeKey="analytics">
        <div />
      </CourseStaffShell>,
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ inline: 'nearest', block: 'nearest' });
  });

  it('marks the active section and nothing else', () => {
    render(
      <CourseStaffShell sections={sections} activeKey="gradebook">
        <div />
      </CourseStaffShell>,
    );

    const active = screen.getByRole('link', { name: 'Gradebook' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active.className).toContain('text-amber-700');
    const idle = screen.getByRole('link', { name: 'Analytics' });
    expect(idle).not.toHaveAttribute('aria-current');
    expect(idle.className).not.toContain('text-amber-700');
  });

  it('renders the section icon hidden from assistive tech', () => {
    render(
      <CourseStaffShell sections={sections} activeKey="instructor">
        <div />
      </CourseStaffShell>,
    );
    const link = screen.getByRole('link', { name: 'Instructor Dashboard' });
    expect(within(link).getByTestId('icon-dashboard')).toHaveAttribute('aria-hidden', 'true');
    expect(within(link).getByTestId('icon-dashboard').className).toContain('text-amber-600');
  });

  it('opens external sections in a new tab with an outbound marker', () => {
    render(
      <CourseStaffShell sections={sections} activeKey="instructor">
        <div />
      </CourseStaffShell>,
    );
    const studio = screen.getByRole('link', { name: 'Edit in Studio' });
    expect(studio).toHaveAttribute('target', '_blank');
    expect(studio).toHaveAttribute('href', 'https://studio.example.org/course/x');
    expect(within(studio).getByTestId('icon-external')).toBeInTheDocument();
  });

  it.each(['analytics', 'configuration', 'instructor'])(
    'lets the content column scroll for the long %s page',
    (key) => {
      render(
        <CourseStaffShell sections={sections} activeKey={key}>
          <div />
        </CourseStaffShell>,
      );
      expect(screen.getByTestId('course-staff-content').className).toContain('overflow-y-auto');
    },
  );

  it('leaves scrolling to the iframe for the gradebook (and with no active key)', () => {
    const { rerender } = render(
      <CourseStaffShell sections={sections} activeKey="gradebook">
        <div />
      </CourseStaffShell>,
    );
    expect(screen.getByTestId('course-staff-content').className).not.toContain('overflow-y-auto');

    rerender(
      <CourseStaffShell sections={sections}>
        <div />
      </CourseStaffShell>,
    );
    expect(screen.getByTestId('course-staff-content').className).not.toContain('overflow-y-auto');
  });
});
