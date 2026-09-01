import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt || ''} {...props} />,
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'test-tenant',
}));

const mockUseCanCreateCourse = vi.fn();
vi.mock('@/components/course-creation-access-guard', () => ({
  useCanCreateCourse: () => mockUseCanCreateCourse(),
}));

vi.mock('@/components/create-course-button', () => ({
  CreateCourseButton: () => <button data-testid="create-course-button">Create Course</button>,
}));

const mockGetSupportEmail = vi.fn();
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: () => ({ getSupportEmail: mockGetSupportEmail }),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      supportEmail: () => 'fallback@example.com',
    },
  },
}));

import { NoCoursesEmptyBox } from '../no-courses-empty-box';

describe('NoCoursesEmptyBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCanCreateCourse.mockReturnValue({ canCreateCourse: false, resolved: true });
    mockGetSupportEmail.mockReturnValue('support@tenant.com');
  });

  it('shows a neutral message while access state is unresolved', () => {
    mockUseCanCreateCourse.mockReturnValue({ canCreateCourse: false, resolved: false });

    render(<NoCoursesEmptyBox />);

    expect(screen.getByText('No courses available.')).toBeInTheDocument();
    expect(screen.queryByTestId('create-course-button')).not.toBeInTheDocument();
    expect(screen.queryByText('Contact Support')).not.toBeInTheDocument();
  });

  it('shows the create-course CTA for course creators', () => {
    mockUseCanCreateCourse.mockReturnValue({ canCreateCourse: true, resolved: true });

    render(<NoCoursesEmptyBox />);

    expect(screen.getByText('No courses available yet.')).toBeInTheDocument();
    expect(screen.getByText('Create the first course for your platform.')).toBeInTheDocument();
    expect(screen.getByTestId('create-course-button')).toBeInTheDocument();
    expect(screen.queryByText('Contact Support')).not.toBeInTheDocument();
  });

  it('shows a mailto support CTA for non-creators using the tenant support email', () => {
    render(<NoCoursesEmptyBox />);

    expect(screen.getByText('No courses have been created yet.')).toBeInTheDocument();
    const link = screen.getByText('Contact Support').closest('a');
    expect(link).toHaveAttribute('href', 'mailto:support@tenant.com');
    expect(screen.queryByTestId('create-course-button')).not.toBeInTheDocument();
  });

  it('falls back to the configured support email when tenant metadata has none', () => {
    mockGetSupportEmail.mockReturnValue('');

    render(<NoCoursesEmptyBox />);

    const link = screen.getByText('Contact Support').closest('a');
    expect(link).toHaveAttribute('href', 'mailto:fallback@example.com');
  });

  it('applies the provided className to the wrapper', () => {
    const { container } = render(<NoCoursesEmptyBox className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
