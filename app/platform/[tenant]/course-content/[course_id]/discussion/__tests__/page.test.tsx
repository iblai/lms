import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/navigation', () => ({
  useParams: () => ({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' }),
}));

const availability = vi.hoisted(() => ({ data: undefined as boolean | undefined }));
const availabilityQuery = vi.fn();
vi.mock('@/services/discussions', () => ({
  useGetDiscussionsAvailableQuery: (args: any) => {
    availabilityQuery(args);
    return { data: availability.data };
  },
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
  beforeEach(() => {
    availability.data = undefined;
    props.mockClear();
  });

  it('renders the native discussions page for the decoded course id', () => {
    render(<DiscussionTab />);
    expect(screen.getByTestId('course-discussions')).toBeInTheDocument();
    expect(props).toHaveBeenCalledWith({ courseId: 'course-v1:test+course+2024' });
  });

  it('keeps the discussions page up while availability is unknown or confirmed', () => {
    availability.data = true;
    render(<DiscussionTab />);
    expect(screen.getByTestId('course-discussions')).toBeInTheDocument();
    expect(availabilityQuery).toHaveBeenCalledWith({ courseId: 'course-v1:test+course+2024' });
  });

  it('says discussions are unavailable when the threads list 404s', () => {
    availability.data = false;
    render(<DiscussionTab />);
    expect(screen.getByTestId('discussions-unavailable')).toHaveTextContent(
      "Discussions aren't available for this course.",
    );
    expect(screen.queryByTestId('course-discussions')).not.toBeInTheDocument();
    expect(props).not.toHaveBeenCalled();
  });
});
