import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      studioUrl: () => 'https://studio.example.com',
    },
  },
}));

const mockSetField = vi.fn();
const mockHandleFormSubmit = vi.fn();
const mockUseCourseCreation = vi.fn();
vi.mock('@/hooks/course-creation/use-course-creation', () => ({
  useCourseCreation: () => mockUseCourseCreation(),
}));

import { CourseCreationForm } from '../course-creation-form';

const baseHookState = {
  fields: { display_name: '', description: '' },
  setField: mockSetField,
  submitting: false,
  createdCourseKey: null,
  handleFormSubmit: mockHandleFormSubmit,
};

describe('CourseCreationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCourseCreation.mockReturnValue({ ...baseHookState });
  });

  it('renders name and description fields', () => {
    render(<CourseCreationForm />);

    expect(screen.getByLabelText('Course name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create course/i })).toBeInTheDocument();
  });

  it('propagates field edits through setField', () => {
    render(<CourseCreationForm />);

    fireEvent.change(screen.getByLabelText('Course name *'), {
      target: { value: 'New Course' },
    });
    fireEvent.change(screen.getByLabelText('Description *'), {
      target: { value: 'New description' },
    });

    expect(mockSetField).toHaveBeenCalledWith('display_name', 'New Course');
    expect(mockSetField).toHaveBeenCalledWith('description', 'New description');
  });

  it('submits via handleFormSubmit', () => {
    render(<CourseCreationForm />);

    fireEvent.click(screen.getByRole('button', { name: /create course/i }));

    expect(mockHandleFormSubmit).toHaveBeenCalledTimes(1);
  });

  it('omits the cancel button when onCancel is not provided', () => {
    render(<CourseCreationForm />);

    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('invokes onCancel from the cancel button', () => {
    const onCancel = vi.fn();
    render(<CourseCreationForm onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables actions and shows a spinner while submitting', () => {
    mockUseCourseCreation.mockReturnValue({ ...baseHookState, submitting: true });
    const onCancel = vi.fn();
    render(<CourseCreationForm onCancel={onCancel} />);

    expect(screen.getByRole('button', { name: /create course/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the success hand-off with a Studio link after creation', () => {
    mockUseCourseCreation.mockReturnValue({
      ...baseHookState,
      createdCourseKey: 'course-v1:org+CS101+2026',
    });
    const onCancel = vi.fn();
    render(<CourseCreationForm onCancel={onCancel} />);

    expect(screen.getByText('Course created successfully.')).toBeInTheDocument();
    const link = screen.getByText('Continue editing in Studio').closest('a');
    expect(link).toHaveAttribute(
      'href',
      'https://studio.example.com/course/course-v1:org+CS101+2026',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.queryByLabelText('Course name *')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('omits the Close button in the success view without onCancel', () => {
    mockUseCourseCreation.mockReturnValue({
      ...baseHookState,
      createdCourseKey: 'course-v1:org+CS101+2026',
    });
    render(<CourseCreationForm />);

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });
});
