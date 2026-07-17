import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

import { AllTimePerLearnerBox } from '../all-time-perlearner-box';

describe('AllTimePerLearnerBox', () => {
  const defaultProps = {
    total_time_spent: 7200,
    courses: 4,
    credentials: 2,
    skills: 6,
  };

  it('renders without crashing', () => {
    const { container } = render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders "Highlights" heading', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('Highlights')).toBeInTheDocument();
  });

  it('renders Time Spent label', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('Time Spent')).toBeInTheDocument();
  });

  it('renders Courses label', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('Courses')).toBeInTheDocument();
  });

  it('renders Credentials label', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('Credentials')).toBeInTheDocument();
  });

  it('renders Skills label', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('converts time spent to hours correctly', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    // 7200 seconds = 2 hours
    expect(screen.getByText('2 hours')).toBeInTheDocument();
  });

  it('displays courses count as a link to the profile courses page', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    const link = screen.getByRole('link', { name: 'View courses' });
    expect(link).toHaveTextContent('4');
    expect(link).toHaveAttribute('href', '/platform/test-tenant/profile/courses');
  });

  it('displays credentials count as a link to the profile credentials page', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    const link = screen.getByRole('link', { name: 'View credentials' });
    expect(link).toHaveTextContent('2');
    expect(link).toHaveAttribute('href', '/platform/test-tenant/profile/credentials');
  });

  it('displays skills count as a link to the profile skills page', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    const link = screen.getByRole('link', { name: 'View skills' });
    expect(link).toHaveTextContent('6');
    expect(link).toHaveAttribute('href', '/platform/test-tenant/profile/skills');
  });

  it('handles zero time spent', () => {
    render(<AllTimePerLearnerBox {...defaultProps} total_time_spent={0} />);
    expect(screen.getByText('0 hours')).toBeInTheDocument();
  });

  it('handles NaN time spent', () => {
    render(<AllTimePerLearnerBox {...defaultProps} total_time_spent={NaN} />);
    expect(screen.getByText('0 hours')).toBeInTheDocument();
  });

  it('rounds time spent to nearest hour', () => {
    // 5400 seconds = 1.5 hours, rounded = 2
    render(<AllTimePerLearnerBox {...defaultProps} total_time_spent={5400} />);
    expect(screen.getByText('2 hours')).toBeInTheDocument();
  });

  it('handles large time values', () => {
    render(<AllTimePerLearnerBox {...defaultProps} total_time_spent={360000} />);
    expect(screen.getByText('100 hours')).toBeInTheDocument();
  });

  it('handles zero values for all props', () => {
    render(<AllTimePerLearnerBox total_time_spent={0} courses={0} credentials={0} skills={0} />);
    expect(screen.getByText('0 hours')).toBeInTheDocument();
    // All zeros displayed
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(3);
  });
});
