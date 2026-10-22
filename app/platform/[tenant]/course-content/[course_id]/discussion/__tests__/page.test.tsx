import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/navigation', () => ({
  useParams: () => ({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' }),
}));

const props = vi.fn();
vi.mock('../_components/course-discussions', () => ({
  CourseDiscussions: (p: any) => {
    props(p);
    return <div data-testid="course-discussions" />;
  },
}));

import DiscussionTab from '../page';

describe('DiscussionTab', () => {
  it('renders the native discussions page for the decoded course id', () => {
    render(<DiscussionTab />);
    expect(screen.getByTestId('course-discussions')).toBeInTheDocument();
    expect(props).toHaveBeenCalledWith({ courseId: 'course-v1:test+course+2024' });
  });
});
