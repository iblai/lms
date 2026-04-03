import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { ProfileStats } from '../profile-stats';

describe('ProfileStats', () => {
  it('renders without crashing', () => {
    render(<ProfileStats />);
    expect(screen.getByText('Points')).toBeInTheDocument();
  });

  it('renders all stat labels', () => {
    render(<ProfileStats />);
    const labels = [
      'Points',
      'Skills',
      'Credentials',
      'Courses',
      'Programs',
      'Pathways',
      'Resources',
      'Assessments',
      'Videos',
    ];
    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders stat values', () => {
    render(<ProfileStats />);
    // Skills has value 3, Courses has value 4, rest are 0
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders 9 stat items in 3 rows', () => {
    const { container } = render(<ProfileStats />);
    const rows = container.querySelectorAll('.grid-cols-3');
    expect(rows.length).toBe(3);
  });

  it('renders all zero values except Skills and Courses', () => {
    render(<ProfileStats />);
    // There should be 7 zeros (all except Skills=3 and Courses=4)
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(7);
  });
});
