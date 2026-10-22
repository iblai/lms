import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/navigation', () => ({
  useParams: () => ({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' }),
}));
vi.mock('@/hooks/use-tenant-param', () => ({ useTenantParam: () => 'acme' }));

const props = vi.fn();
vi.mock('../_components/course-progress', () => ({
  CourseProgress: (p: any) => {
    props(p);
    return <div data-testid="course-progress" />;
  },
}));

import ProgressTab from '../page';

describe('ProgressTab', () => {
  it('renders the native progress page for the decoded course id', () => {
    render(<ProgressTab />);
    expect(screen.getByTestId('course-progress')).toBeInTheDocument();
    expect(props).toHaveBeenCalledWith({
      courseId: 'course-v1:test+course+2024',
      courseBasePath: '/platform/acme/course-content/course-v1%3Atest%2Bcourse%2B2024',
    });
  });
});
