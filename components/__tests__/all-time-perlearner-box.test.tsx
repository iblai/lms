import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AllTimePerLearnerBox } from '../all-time-perlearner-box';

describe('AllTimePerLearnerBox', () => {
  const defaultProps = {
    total_assessments: 10,
    total_time_spent: 7200,
    total_videos: 5,
    course_completions: 3,
  };

  it('renders without crashing', () => {
    const { container } = render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders "All Time" heading', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('renders Time Spent label', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('Time Spent')).toBeInTheDocument();
  });

  it('renders Watched Video label', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('Watched Video')).toBeInTheDocument();
  });

  it('renders Assessments label', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('Assessments')).toBeInTheDocument();
  });

  it('renders Courses Completions label', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('Courses Completions')).toBeInTheDocument();
  });

  it('converts time spent to hours correctly', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    // 7200 seconds = 2 hours
    expect(screen.getByText('2 hours')).toBeInTheDocument();
  });

  it('displays total videos count', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays total assessments count', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('displays course completions count', () => {
    render(<AllTimePerLearnerBox {...defaultProps} />);
    expect(screen.getByText('3')).toBeInTheDocument();
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
    render(
      <AllTimePerLearnerBox
        total_assessments={0}
        total_time_spent={0}
        total_videos={0}
        course_completions={0}
      />,
    );
    expect(screen.getByText('0 hours')).toBeInTheDocument();
    // All zeros displayed
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(3);
  });
});
