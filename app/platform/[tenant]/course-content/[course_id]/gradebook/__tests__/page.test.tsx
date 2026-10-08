import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/navigation', () => ({
  useParams: () => ({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' }),
}));

const gradebookProps = vi.fn();
vi.mock('../_components/course-gradebook', () => ({
  CourseGradebook: (props: any) => {
    gradebookProps(props);
    return <div data-testid="course-gradebook" />;
  },
}));

import GradebookTab from '../page';

describe('GradebookTab', () => {
  it('renders the native gradebook for the decoded course id', () => {
    render(<GradebookTab />);
    expect(screen.getByTestId('course-gradebook')).toBeInTheDocument();
    expect(gradebookProps).toHaveBeenCalledWith({ courseId: 'course-v1:test+course+2024' });
  });
});
