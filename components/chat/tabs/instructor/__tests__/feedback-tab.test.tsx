import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import FeedbackTab from '../feedback-tab';

describe('FeedbackTab', () => {
  it('renders without crashing with empty data', () => {
    render(<FeedbackTab feedbackData={[]} />);
    expect(screen.getByText('Student Feedback')).toBeInTheDocument();
  });

  it('shows empty message when feedbackData is empty', () => {
    render(<FeedbackTab feedbackData={[]} />);
    expect(screen.getByText('No feedback available.')).toBeInTheDocument();
  });

  it('renders feedback items when data is provided', () => {
    const feedbackData = [
      {
        studentName: 'John Doe',
        comment: 'Great course!',
        rating: 4,
        suggestions: 'Add more examples',
      },
    ];
    render(<FeedbackTab feedbackData={feedbackData} />);
    expect(screen.getByText('Student: John Doe')).toBeInTheDocument();
    expect(screen.getByText('Feedback: Great course!')).toBeInTheDocument();
    expect(screen.getByText('Rating: 4 / 5')).toBeInTheDocument();
    expect(screen.getByText('Suggestions: Add more examples')).toBeInTheDocument();
  });

  it('shows "Unknown" when studentName is missing', () => {
    const feedbackData = [{ comment: 'Nice' }];
    render(<FeedbackTab feedbackData={feedbackData} />);
    expect(screen.getByText('Student: Unknown')).toBeInTheDocument();
  });

  it('shows default comment when comment is missing', () => {
    const feedbackData = [{ studentName: 'Jane' }];
    render(<FeedbackTab feedbackData={feedbackData} />);
    expect(screen.getByText('Feedback: No comment provided.')).toBeInTheDocument();
  });

  it('does not render rating when not provided', () => {
    const feedbackData = [{ studentName: 'Jane', comment: 'Good' }];
    render(<FeedbackTab feedbackData={feedbackData} />);
    expect(screen.queryByText(/Rating:/)).not.toBeInTheDocument();
  });

  it('does not render suggestions when not provided', () => {
    const feedbackData = [{ studentName: 'Jane', comment: 'Good' }];
    render(<FeedbackTab feedbackData={feedbackData} />);
    expect(screen.queryByText(/Suggestions:/)).not.toBeInTheDocument();
  });

  it('renders multiple feedback items', () => {
    const feedbackData = [
      { studentName: 'Alice', comment: 'Excellent' },
      { studentName: 'Bob', comment: 'Good' },
      { studentName: 'Charlie', comment: 'Average' },
    ];
    render(<FeedbackTab feedbackData={feedbackData} />);
    expect(screen.getByText('Student: Alice')).toBeInTheDocument();
    expect(screen.getByText('Student: Bob')).toBeInTheDocument();
    expect(screen.getByText('Student: Charlie')).toBeInTheDocument();
  });
});
