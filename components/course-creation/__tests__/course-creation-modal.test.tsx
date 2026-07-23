import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('../course-creation-form', () => ({
  CourseCreationForm: ({ onCancel }: { onCancel?: () => void }) => (
    <div data-testid="course-creation-form">
      <button data-testid="form-cancel" onClick={onCancel}>
        cancel
      </button>
    </div>
  ),
}));

import { CourseCreationModal } from '../course-creation-modal';

describe('CourseCreationModal', () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while closed', () => {
    render(<CourseCreationModal open={false} onOpenChange={onOpenChange} />);

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders the title and form when open', () => {
    render(<CourseCreationModal open onOpenChange={onOpenChange} />);

    expect(screen.getByText('Create Course')).toBeInTheDocument();
    expect(screen.getByTestId('course-creation-form')).toBeInTheDocument();
  });

  it('closes via the form cancel handler', () => {
    render(<CourseCreationModal open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByTestId('form-cancel'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
