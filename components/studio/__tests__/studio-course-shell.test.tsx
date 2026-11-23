import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const nav = vi.hoisted(() => ({ pathname: '', search: '' }));
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
}));
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock(
  '@/app/platform/[tenant]/course-content/[course_id]/instructor/_components/instructor-dashboard',
  () => ({
    DASHBOARD_SECTIONS: [
      { key: 'overview', label: 'Overview' },
      { key: 'membership', label: 'Membership' },
      { key: 'reports', label: 'Reports' },
    ],
    isDashboardSection: (value: unknown) =>
      ['overview', 'membership', 'reports'].includes(value as string),
  }),
);
vi.mock('@/components/course-admin-shell', () => ({
  CourseAdminShell: ({ sections, activeKey, children }: any) => (
    <div data-testid="admin-shell" data-active={activeKey}>
      {sections.map((section: any) => (
        <a key={section.key} href={section.href} data-group={section.group ?? 'lead'}>
          {section.label}
        </a>
      ))}
      {children}
    </div>
  ),
}));
vi.mock('@/hooks/use-tenant-param', () => ({ useTenantParam: () => 'acme' }));

const state = vi.hoisted(() => ({
  canSell: true,
  canViewAnalytics: true,
  settings: undefined as any,
  course: undefined as any,
}));
vi.mock('@/hooks/use-can-sell-items', () => ({ useCanSellItems: () => state.canSell }));
vi.mock('@/lib/hooks', () => ({ useAppSelector: () => ({}) }));
vi.mock('@/features/rbac', () => ({ selectRbacPermissions: () => ({}) }));
vi.mock('@/hoc', () => ({ checkRbacPermission: () => state.canViewAnalytics }));
vi.mock('@/services/studio', () => ({
  useGetStudioCourseSettingsQuery: () => ({ data: state.settings }),
}));
vi.mock('@/services/course-metadata', () => ({
  useGetCourseMetaDataQuery: () => ({ data: state.course }),
}));

import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { StudioCourseShell } from '../studio-course-shell';

const COURSE_KEY = 'course-v1:org+CS101+2026';
const BASE = '/platform/acme/studio/courses/course-v1%3Aorg%2BCS101%2B2026';

function ContextProbe() {
  const { course } = useContext(CourseOutlineContext);
  return <span data-testid="context-course">{course?.display_name ?? 'none'}</span>;
}

const renderShell = () =>
  render(
    <StudioCourseShell courseId={COURSE_KEY}>
      <ContextProbe />
    </StudioCourseShell>,
  );

describe('StudioCourseShell', () => {
  beforeEach(() => {
    nav.pathname = `${BASE}/details`;
    nav.search = '';
    state.canSell = true;
    state.canViewAnalytics = true;
    state.settings = { formData: { title: 'Catalog Title' } };
    state.course = { display_name: 'Algebra' };
  });

  it('names the course and links back to Studio and out to the course page', () => {
    renderShell();

    expect(screen.getByRole('heading', { name: 'Algebra' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Studio' })).toHaveAttribute(
      'href',
      '/platform/acme/studio',
    );
    expect(screen.getByRole('link', { name: 'View course' })).toHaveAttribute(
      'href',
      '/platform/acme/courses/course-v1%3Aorg%2BCS101%2B2026',
    );
  });

  it('falls back to the catalog title, then the course key, for the name', () => {
    state.course = undefined;
    const { unmount } = renderShell();
    expect(screen.getByRole('heading', { name: 'Catalog Title' })).toBeInTheDocument();
    unmount();

    state.settings = undefined;
    renderShell();
    expect(screen.getByRole('heading', { name: COURSE_KEY })).toBeInTheDocument();
  });

  it('lists the Studio sections first, then the administration pages', () => {
    renderShell();

    const labels = screen
      .getAllByRole('link')
      .filter((link) => link.hasAttribute('data-group'))
      .map((link) => link.textContent);
    expect(labels).toEqual([
      'Details',
      'Outline',
      'Grades',
      'Membership',
      'Reports',
      'Overview',
      'Analytics',
      'Settings',
      'Monetization',
    ]);
    expect(screen.getByRole('link', { name: 'Outline' })).toHaveAttribute(
      'href',
      `${BASE}/outline`,
    );
    expect(screen.getByRole('link', { name: 'Membership' })).toHaveAttribute(
      'href',
      `${BASE}/instructor?section=membership`,
    );
    expect(screen.getByRole('link', { name: 'Membership' })).toHaveAttribute(
      'data-group',
      'learners',
    );
    expect(screen.getByRole('link', { name: 'Reports' })).toHaveAttribute('data-group', 'insights');
  });

  it('hides Analytics and Monetization from people without access to them', () => {
    state.canSell = false;
    state.canViewAnalytics = false;
    renderShell();
    expect(screen.queryByRole('link', { name: 'Analytics' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Monetization' })).not.toBeInTheDocument();
  });

  it('marks the section from the last path segment', () => {
    nav.pathname = `${BASE}/outline`;
    renderShell();
    expect(screen.getByTestId('admin-shell')).toHaveAttribute('data-active', 'outline');
  });

  it('marks the instructor sub-section from the query string', () => {
    nav.pathname = `${BASE}/instructor`;
    nav.search = 'section=membership';
    const { unmount } = renderShell();
    expect(screen.getByTestId('admin-shell')).toHaveAttribute(
      'data-active',
      'instructor:membership',
    );
    unmount();

    nav.search = 'section=bogus';
    renderShell();
    expect(screen.getByTestId('admin-shell')).toHaveAttribute('data-active', 'instructor:overview');
  });

  it('hands the course to the pages through the outline context', () => {
    const { unmount } = renderShell();
    expect(screen.getByTestId('context-course')).toHaveTextContent('Algebra');
    unmount();

    state.course = undefined;
    renderShell();
    expect(screen.getByTestId('context-course')).toHaveTextContent('none');
  });
});
