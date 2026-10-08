import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('../overview-section', () => ({ OverviewSection: () => <div data-testid="overview" /> }));
vi.mock('../membership-section', () => ({
  MembershipSection: () => <div data-testid="membership" />,
}));
vi.mock('../cohorts-section', () => ({ CohortsSection: () => <div data-testid="cohorts" /> }));
vi.mock('../extensions-section', () => ({
  ExtensionsSection: () => <div data-testid="extensions" />,
}));
vi.mock('../attempts-section', () => ({
  AttemptsSection: () => <div data-testid="attempts" />,
}));
vi.mock('../reports-section', () => ({ ReportsSection: () => <div data-testid="reports" /> }));

import {
  DASHBOARD_SECTIONS,
  InstructorDashboard,
  isDashboardSection,
} from '../instructor-dashboard';

const KEYS = DASHBOARD_SECTIONS.map((section) => section.key);

describe('InstructorDashboard', () => {
  it('recognises section keys', () => {
    expect(isDashboardSection('reports')).toBe(true);
    expect(isDashboardSection('nope')).toBe(false);
    expect(isDashboardSection(null)).toBe(false);
    expect(KEYS).toEqual([
      'overview',
      'membership',
      'cohorts',
      'extensions',
      'attempts',
      'reports',
    ]);
  });

  it.each(KEYS)('renders only the %s section', (section) => {
    render(<InstructorDashboard courseId="c" courseBasePath="/b" section={section} />);
    expect(screen.getByTestId('instructor-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId(section)).toBeInTheDocument();
    KEYS.filter((other) => other !== section).forEach((other) =>
      expect(screen.queryByTestId(other)).not.toBeInTheDocument(),
    );
  });
});
