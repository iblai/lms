import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/profile-sidebar', () => ({
  ProfileSidebar: () => <div data-testid="profile-sidebar" />,
}));

vi.mock('@/components/suggested-courses', () => ({
  SuggestedCourses: () => <div data-testid="suggested-courses" />,
}));

vi.mock('@/components/my-courses', () => ({
  MyCourses: () => <div data-testid="my-courses" />,
}));

vi.mock('@/utils/helpers', () => ({
  isRecommendedTabHidden: vi.fn(() => false),
}));

import Dashboard from '../page';
import { isRecommendedTabHidden } from '@/utils/helpers';

describe('Dashboard (home page)', () => {
  it('renders the profile sidebar', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('profile-sidebar')).toBeInTheDocument();
  });

  it('renders MyCourses', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('my-courses')).toBeInTheDocument();
  });

  it('renders SuggestedCourses when recommended tab is not hidden', () => {
    vi.mocked(isRecommendedTabHidden).mockReturnValue(false);

    render(<Dashboard />);

    expect(screen.getByTestId('suggested-courses')).toBeInTheDocument();
  });

  it('hides SuggestedCourses when recommended tab is hidden', () => {
    vi.mocked(isRecommendedTabHidden).mockReturnValue(true);

    render(<Dashboard />);

    expect(screen.queryByTestId('suggested-courses')).not.toBeInTheDocument();
  });
});
