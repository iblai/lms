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

const mockUpdateUserExperience = vi.fn().mockResolvedValue({});
const mockCreateUserExperience = vi.fn().mockResolvedValue({});
const mockDeleteExperience = vi.fn().mockResolvedValue({});

vi.mock('@/services/career', () => ({
  useGetUserCompaniesQuery: vi.fn(() => ({
    data: [
      { id: 1, name: 'Google' },
      { id: 2, name: 'Apple' },
    ],
  })),
  useUpdateUserExperienceMutation: vi.fn(() => [mockUpdateUserExperience, { isError: false }]),
  useCreateUserExperienceMutation: vi.fn(() => [mockCreateUserExperience, { isError: false }]),
  useDeleteUserExperienceMutation: vi.fn(() => [
    mockDeleteExperience,
    { isLoading: false, isError: false },
  ]),
}));

vi.mock('@iblai/iblai-api', () => ({
  Experience: {},
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/constants/user-data', () => ({
  EMPLOYMENT_TYPES: ['Full-time', 'Part-time', 'Contract'],
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

import { EditExperienceDialog } from '../edit-experience-dialog';

describe('EditExperienceDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
    setOpenAddCompanyDialog: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when open', () => {
    render(<EditExperienceDialog {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<EditExperienceDialog {...defaultProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('shows "Add Experience" title when no experience is provided', () => {
    render(<EditExperienceDialog {...defaultProps} />);
    expect(screen.getByText('Add Experience')).toBeInTheDocument();
  });

  it('shows "Edit Experience" title when experience with id is provided', () => {
    const experience = { id: 1, title: 'Engineer' } as any;
    render(<EditExperienceDialog {...defaultProps} experience={experience} />);
    expect(screen.getByText('Edit Experience')).toBeInTheDocument();
  });

  it('shows delete button when editing existing experience', () => {
    const experience = { id: 1, title: 'Engineer' } as any;
    render(<EditExperienceDialog {...defaultProps} experience={experience} onDelete={vi.fn()} />);
    expect(screen.getByText('Delete Experience')).toBeInTheDocument();
  });

  it('does not show delete button for new experience', () => {
    render(<EditExperienceDialog {...defaultProps} />);
    expect(screen.queryByText('Delete Experience')).not.toBeInTheDocument();
  });

  it('calls onOpenChange(false) when cancel is clicked', () => {
    render(<EditExperienceDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders Save button', () => {
    render(<EditExperienceDialog {...defaultProps} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders title input field', () => {
    render(<EditExperienceDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g., Software Engineer')).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    render(<EditExperienceDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('Describe your experience experience')).toBeInTheDocument();
  });

  it('renders "Add new company" button', () => {
    render(<EditExperienceDialog {...defaultProps} />);
    expect(screen.getByText('Add new company')).toBeInTheDocument();
  });

  it('calls setOpenAddCompanyDialog when add company button is clicked', () => {
    render(<EditExperienceDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Add new company'));
    expect(defaultProps.setOpenAddCompanyDialog).toHaveBeenCalledWith(true);
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
      fireEvent.change(screen.getByPlaceholderText('e.g., Software Engineer'), {
        target: { value: 'Software Engineer' },
      });
      screen.getAllByTestId('select-pick').forEach((button) => fireEvent.click(button));
      await act(async () => {
        fireEvent.click(screen.getByText('Save'));
      });
    };

    it('reports a failed experience update alongside the toast', async () => {
      mockUpdateUserExperience.mockRejectedValue(new Error('service down'));
      render(<EditExperienceDialog {...defaultProps} experience={{ id: 1 } as any} />);

      await submit();

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to update experience information:',
        expect.any(Error),
      );
    });

    it('reports a failed experience creation alongside the toast', async () => {
      mockCreateUserExperience.mockRejectedValue(new Error('service down'));
      render(<EditExperienceDialog {...defaultProps} />);

      await submit();

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to create experience information:',
        expect.any(Error),
      );
    });

    it('reports a failed experience deletion alongside the toast', async () => {
      mockDeleteExperience.mockRejectedValue(new Error('service down'));
      render(
        <EditExperienceDialog {...defaultProps} experience={{ id: 1 } as any} onDelete={vi.fn()} />,
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Delete Experience'));
      });

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to delete experience information:',
        expect.any(Error),
      );
    });
  });
});
