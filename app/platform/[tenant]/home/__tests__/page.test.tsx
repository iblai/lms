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

import Dashboard from '../page';

describe('Dashboard (home page)', () => {
  it('renders the hero band', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('home-hero')).toBeInTheDocument();
  });

  it('renders the activity overview band', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('home-activity-overview')).toBeInTheDocument();
  });

  it('does not render the My Courses section (moved to the catalog page)', () => {
    render(<Dashboard />);

    expect(screen.queryByTestId('my-courses')).not.toBeInTheDocument();
  });

  it('renders the discover rail', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('home-discover-rail')).toBeInTheDocument();
  });

  it('does not render the Suggested Courses section (moved to the catalog page)', () => {
    render(<Dashboard />);

    expect(screen.queryByTestId('suggested-courses')).not.toBeInTheDocument();
  });

  it('does not render the old profile sidebar column', () => {
    render(<Dashboard />);

    expect(screen.queryByTestId('profile-sidebar')).not.toBeInTheDocument();
  });
});
