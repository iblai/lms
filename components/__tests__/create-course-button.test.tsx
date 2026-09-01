import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockUseCanCreateCourse = vi.fn();
vi.mock('@/components/course-creation-access-guard', () => ({
  useCanCreateCourse: () => mockUseCanCreateCourse(),
}));

vi.mock('@/components/course-creation/course-creation-modal', () => ({
  CourseCreationModal: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div data-testid="course-creation-modal" data-open={open}>
      <button data-testid="modal-close" onClick={() => onOpenChange(false)}>
        close
      </button>
    </div>
  ),
}));

import { CreateCourseButton } from '../create-course-button';

describe('CreateCourseButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCanCreateCourse.mockReturnValue({ canCreateCourse: true, resolved: true });
  });

  it('renders nothing when the user cannot create courses', () => {
    mockUseCanCreateCourse.mockReturnValue({ canCreateCourse: false, resolved: true });

    const { container } = render(<CreateCourseButton />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the button with a closed modal for course creators', () => {
    render(<CreateCourseButton />);

    expect(screen.getByRole('button', { name: /create course/i })).toBeInTheDocument();
    expect(screen.getByTestId('course-creation-modal')).toHaveAttribute('data-open', 'false');
  });

  it('opens the modal on click', () => {
    render(<CreateCourseButton />);

    fireEvent.click(screen.getByRole('button', { name: /create course/i }));

    expect(screen.getByTestId('course-creation-modal')).toHaveAttribute('data-open', 'true');
  });

  it('closes the modal via onOpenChange', () => {
    render(<CreateCourseButton />);

    fireEvent.click(screen.getByRole('button', { name: /create course/i }));
    fireEvent.click(screen.getByTestId('modal-close'));

    expect(screen.getByTestId('course-creation-modal')).toHaveAttribute('data-open', 'false');
  });
});
