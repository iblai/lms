import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('../course-card', () => ({
  CourseCard: ({ course }: any) => <div data-testid="course-card">{course.title}</div>,
}));

vi.mock('../course-card-skeleton', () => ({
  CourseCardSkeleton: () => <div data-testid="course-card-skeleton" />,
}));

import { RecommendedCourses } from '../recommended-courses';

describe('RecommendedCourses', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders without crashing', () => {
    const { container } = render(<RecommendedCourses />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows 12 skeletons while loading', () => {
    render(<RecommendedCourses />);
    const skeletons = screen.getAllByTestId('course-card-skeleton');
    expect(skeletons).toHaveLength(12);
  });

  it('shows course cards after loading completes', async () => {
    render(<RecommendedCourses />);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    const cards = screen.getAllByTestId('course-card');
    expect(cards).toHaveLength(12);
  });

  it('renders correct course titles after loading', async () => {
    render(<RecommendedCourses />);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Managing Cybersecurity Incident Response')).toBeInTheDocument();
    expect(screen.getByText('Going Cloud Native with Linux')).toBeInTheDocument();
    expect(screen.getByText('Data-Driven Leadership')).toBeInTheDocument();
  });

  it('does not show skeletons after loading completes', async () => {
    render(<RecommendedCourses />);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByTestId('course-card-skeleton')).not.toBeInTheDocument();
  });
});
