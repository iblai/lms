import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

const { mockCreateUserInstitution, mockCreateState } = vi.hoisted(() => ({
  mockCreateUserInstitution: vi.fn(),
  mockCreateState: { isError: false },
}));

vi.mock('@/services/career', () => ({
  useCreateUserInstitutionMutation: vi.fn(() => [mockCreateUserInstitution, mockCreateState]),
}));

vi.mock('@iblai/iblai-api', () => ({
  InstitutionTypeEnum: {},
}));

vi.mock('@/constants/user-data', () => ({
  INSTITUTION_TYPE: [
    { value: 'university', label: 'University' },
    { value: 'college', label: 'College' },
  ],
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/select', () => ({
  // Exposes a control the tests can use to satisfy each Select's validator,
  // which the real Radix trigger can't drive in jsdom. The validators only
  // check for a non-empty value, so one placeholder value serves both selects.
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

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

import { AddInstitutionDialog } from '../add-institution-dialog';

describe('AddInstitutionDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when open', () => {
    const { container } = render(<AddInstitutionDialog {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('does not render when closed', () => {
    const { queryByTestId } = render(<AddInstitutionDialog {...defaultProps} open={false} />);
    expect(queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders Add Institution title', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByText('Add Institution')).toBeInTheDocument();
  });

  it('renders Name field', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders Institution type field', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByText('Institution type')).toBeInTheDocument();
  });

  it('renders Accreditation field', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByText('Accreditation')).toBeInTheDocument();
  });

  it('renders Year of establishment field', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByText('Year of establishment')).toBeInTheDocument();
  });

  it('renders Location field', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('renders Website URL field', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByText('Website URL')).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders Save button', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders name placeholder', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g Harvard University')).toBeInTheDocument();
  });

  it('renders accreditation placeholder', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g WASC')).toBeInTheDocument();
  });

  it('renders location placeholder', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g New York, NY')).toBeInTheDocument();
  });

  it('renders website placeholder', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g https://www.example.com')).toBeInTheDocument();
  });

  it('calls onOpenChange when Cancel is clicked', () => {
    render(<AddInstitutionDialog {...defaultProps} />);
    screen.getByText('Cancel').click();
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
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
      const fill = (placeholder: string, value: string) =>
        fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });

      fill('e.g Harvard University', 'Acme University');
      fill('e.g WASC', 'WASC');
      fill('e.g New York, NY', 'New York, NY');
      fill('e.g https://www.example.com', 'https://acme.example.edu');
      screen.getAllByTestId('select-pick').forEach((button) => fireEvent.click(button));

      await act(async () => {
        fireEvent.click(screen.getByText('Save'));
      });
    };

    beforeEach(() => {
      mockCreateState.isError = false;
      mockCreateUserInstitution.mockResolvedValue({});
    });

    it('reports a rejected create request alongside the toast', async () => {
      mockCreateUserInstitution.mockRejectedValue(new Error('service down'));
      render(<AddInstitutionDialog {...defaultProps} />);

      await submit();

      expect(errorSpy).toHaveBeenCalledWith('Failed to create institution:', expect.any(Error));
    });

    it('reports a create request that comes back flagged as failed', async () => {
      mockCreateState.isError = true;
      render(<AddInstitutionDialog {...defaultProps} />);

      await submit();

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to create institution:',
        expect.objectContaining({ message: 'Create-institution request reported an error' }),
      );
    });
  });
});
