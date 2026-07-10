import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/home/home-hero', () => ({
  HomeHero: () => <div data-testid="home-hero" />,
}));

vi.mock('@/components/home/home-activity-overview', () => ({
  HomeActivityOverview: () => <div data-testid="home-activity-overview" />,
}));

vi.mock('@/components/home/home-discover-rail', () => ({
  HomeDiscoverRail: () => <div data-testid="home-discover-rail" />,
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
  it('renders the hero band', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('home-hero')).toBeInTheDocument();
  });

  it('renders the activity overview band', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('home-activity-overview')).toBeInTheDocument();
  });

  it('renders MyCourses', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('my-courses')).toBeInTheDocument();
  });

  it('renders the discover rail', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('home-discover-rail')).toBeInTheDocument();
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

  it('does not render the old profile sidebar column', () => {
    render(<Dashboard />);

    expect(screen.queryByTestId('profile-sidebar')).not.toBeInTheDocument();
  });
});
