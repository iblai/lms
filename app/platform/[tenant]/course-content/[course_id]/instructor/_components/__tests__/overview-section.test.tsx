import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
vi.mock('lucide-react', () => ({ ArrowUpRight: () => <span /> }));
vi.mock('@/lib/config', () => ({
  config: { urls: { studioUrl: () => 'https://studio.example.org' } },
}));

const hooks = vi.hoisted(() => ({
  gradebook: vi.fn(),
  roles: vi.fn(),
  cohorts: vi.fn(),
  settings: vi.fn(),
  gradingInfo: vi.fn(),
}));
vi.mock('@/services/instructor', () => ({
  useGetGradebookQuery: (...args: any[]) => hooks.gradebook(...args),
  useListCourseRoleMembersQuery: (...args: any[]) => hooks.roles(...args),
  useGetCohortsQuery: (...args: any[]) => hooks.cohorts(...args),
  useGetCohortSettingsQuery: (...args: any[]) => hooks.settings(...args),
  useGetGradingInfoQuery: (...args: any[]) => hooks.gradingInfo(...args),
}));

import { OverviewSection } from '../overview-section';

describe('OverviewSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.gradebook.mockReturnValue({ data: { total_users_count: 42 } });
    hooks.roles.mockImplementation(({ rolename }: any) => ({
      data: rolename === 'staff' ? [{ username: 's1' }, { username: 's2' }] : [{ username: 'i1' }],
    }));
    hooks.cohorts.mockReturnValue({ data: [{ id: 1 }, { id: 2 }] });
    hooks.settings.mockReturnValue({ data: { id: 1, is_cohorted: true } });
    hooks.gradingInfo.mockReturnValue({
      data: {
        grade_cutoffs: { Pass: 0.5, Distinction: 0.8 },
        subsections: [{ graded: true }, { graded: false }, { graded: true }],
      },
    });
  });

  it('shows the headline numbers and quick links', () => {
    render(<OverviewSection courseId="c-1" courseBasePath="/p/t/course-content/c-1" />);
    expect(hooks.gradebook).toHaveBeenCalledWith({ courseId: 'c-1', pageSize: 1 });
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1 admin · 2 staff')).toBeInTheDocument();
    expect(screen.getByText('Cohorts enabled').previousElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Pass mark 80%')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Grades' })).toHaveAttribute(
      'href',
      '/p/t/course-content/c-1/gradebook',
    );
    expect(screen.getByRole('link', { name: 'Analytics' })).toHaveAttribute(
      'href',
      '/p/t/course-content/c-1/analytics',
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/p/t/course-content/c-1/configuration',
    );
    expect(screen.getByRole('link', { name: 'Authoring' })).toHaveAttribute(
      'href',
      'https://studio.example.org/course/c-1',
    );
  });

  it('shows placeholders while data is loading and "Off" when cohorts are disabled', () => {
    hooks.gradebook.mockReturnValue({ data: undefined });
    hooks.roles.mockReturnValue({ data: undefined });
    hooks.cohorts.mockReturnValue({ data: undefined });
    hooks.settings.mockReturnValue({ data: { id: 1, is_cohorted: false } });
    hooks.gradingInfo.mockReturnValue({ data: undefined });
    render(<OverviewSection courseId="c-1" courseBasePath="/base" />);
    expect(screen.getAllByText('…')).toHaveLength(2);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Off')).toBeInTheDocument();
    expect(screen.getByText('Cohorts disabled')).toBeInTheDocument();
    expect(screen.queryByText(/Pass mark/)).not.toBeInTheDocument();
  });
});
