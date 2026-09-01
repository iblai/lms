import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
  getMonthsData: vi.fn(() => [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
  ]),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {},
    urls: {},
  },
}));

const mockUpdateUserEducation = vi.fn().mockResolvedValue({});
const mockCreateUserEducation = vi.fn().mockResolvedValue({});
const mockDeleteEducation = vi.fn().mockResolvedValue({});

vi.mock('@/services/career', () => ({
  useGetUserInstitutionsQuery: vi.fn(() => ({
    data: [
      { id: 1, name: 'MIT' },
      { id: 2, name: 'Stanford' },
    ],
  })),
  useUpdateUserEducationMutation: vi.fn(() => [mockUpdateUserEducation, { isError: false }]),
  useCreateUserEducationMutation: vi.fn(() => [mockCreateUserEducation, { isError: false }]),
  useDeleteUserEducationMutation: vi.fn(() => [
    mockDeleteEducation,
    { isLoading: false, isError: false },
  ]),
}));

vi.mock('@iblai/iblai-api', () => ({
  Education: {},
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/constants/user-data', () => ({
  FIELDS_OF_STUDY: ['Computer Science', 'Mathematics', 'Physics'],
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/select', () => ({
  // Exposes a control the tests can use to satisfy each Select's validator,
  // which the real Radix trigger can't drive in jsdom. The validators only
  // check for a non-empty value.
  Select: ({ children, onValueChange }: any) => (
    <div data-testid="select">
      <button type="button" data-testid="select-pick" onClick={() => onValueChange?.('selected')}>
        pick
      </button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      data-testid={`switch-${id}`}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

import { EditEducationDialog } from '../edit-education-dialog';

describe('EditEducationDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
    setOpenAddInstitutionDialog: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when open', () => {
    render(<EditEducationDialog {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<EditEducationDialog {...defaultProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('shows "Add Education" title when no education is provided', () => {
    render(<EditEducationDialog {...defaultProps} />);
    expect(screen.getByText('Add Education')).toBeInTheDocument();
  });

  it('shows "Edit Education" title when education with id is provided', () => {
    const education = { id: 1, degree: 'BSc', field_of_study: 'CS' } as any;
    render(<EditEducationDialog {...defaultProps} education={education} />);
    expect(screen.getByText('Edit Education')).toBeInTheDocument();
  });

  it('shows delete button when editing existing education', () => {
    const education = { id: 1, degree: 'BSc' } as any;
    render(<EditEducationDialog {...defaultProps} education={education} onDelete={vi.fn()} />);
    expect(screen.getByText('Delete Education')).toBeInTheDocument();
  });

  it('does not show delete button for new education', () => {
    render(<EditEducationDialog {...defaultProps} />);
    expect(screen.queryByText('Delete Education')).not.toBeInTheDocument();
  });

  it('calls onOpenChange(false) when cancel is clicked', () => {
    render(<EditEducationDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders Save button', () => {
    render(<EditEducationDialog {...defaultProps} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders degree input field', () => {
    render(<EditEducationDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g., Bachelor of Science')).toBeInTheDocument();
  });

  it('renders grade input field', () => {
    render(<EditEducationDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g., 3.5')).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    render(<EditEducationDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('Describe your education experience')).toBeInTheDocument();
  });

  it('renders "Add new institution" button', () => {
    render(<EditEducationDialog {...defaultProps} />);
    expect(screen.getByText('Add new institution')).toBeInTheDocument();
  });

  it('calls setOpenAddInstitutionDialog when add institution button is clicked', () => {
    render(<EditEducationDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Add new institution'));
    expect(defaultProps.setOpenAddInstitutionDialog).toHaveBeenCalledWith(true);
  });

  describe('error reporting', () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    const submit = async () => {
      fireEvent.change(screen.getByPlaceholderText('e.g., Bachelor of Science'), {
        target: { value: 'BSc' },
      });
      // Grade is required and must parse to 0-4.
      fireEvent.change(screen.getByPlaceholderText('e.g., 3.5'), { target: { value: '3.5' } });
      screen.getAllByTestId('select-pick').forEach((button) => fireEvent.click(button));
      await act(async () => {
        fireEvent.click(screen.getByText('Save'));
      });
    };

    it('reports a failed education update alongside the toast', async () => {
      mockUpdateUserEducation.mockRejectedValue(new Error('service down'));
      render(<EditEducationDialog {...defaultProps} education={{ id: 1 } as any} />);

      await submit();

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to update education information:',
        expect.any(Error),
      );
    });

    it('reports a failed education creation alongside the toast', async () => {
      mockCreateUserEducation.mockRejectedValue(new Error('service down'));
      render(<EditEducationDialog {...defaultProps} />);

      await submit();

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to create education information:',
        expect.any(Error),
      );
    });

    it('reports a failed education deletion alongside the toast', async () => {
      mockDeleteEducation.mockRejectedValue(new Error('service down'));
      render(
        <EditEducationDialog {...defaultProps} education={{ id: 1 } as any} onDelete={vi.fn()} />,
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Delete Education'));
      });

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to delete education information:',
        expect.any(Error),
      );
    });
  });
});
