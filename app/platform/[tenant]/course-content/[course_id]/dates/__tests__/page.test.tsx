import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/navigation', () => ({
  useParams: () => ({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' }),
}));
vi.mock('@/hooks/use-tenant-param', () => ({ useTenantParam: () => 'acme' }));

const props = vi.fn();
vi.mock('../_components/course-dates', () => ({
  CourseDates: (p: any) => {
    props(p);
    return <div data-testid="course-dates" />;
  },
}));

import DatesTab from '../page';

describe('DatesTab', () => {
  it('renders the native dates page for the decoded course id', () => {
    render(<DatesTab />);
    expect(screen.getByTestId('course-dates')).toBeInTheDocument();
    expect(props).toHaveBeenCalledWith({
      courseId: 'course-v1:test+course+2024',
      courseBasePath: '/platform/acme/course-content/course-v1%3Atest%2Bcourse%2B2024',
    });
  });
});
