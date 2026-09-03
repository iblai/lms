import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

const { mockCreateUserCompany, mockCreateState } = vi.hoisted(() => ({
  mockCreateUserCompany: vi.fn(),
  mockCreateState: { isError: false },
}));

vi.mock('@/services/career', () => ({
  useCreateUserCompanyMutation: vi.fn(() => [mockCreateUserCompany, mockCreateState]),
  useGetUserCompaniesQuery: vi.fn(() => ({ data: [] })),
}));

vi.mock('@/constants/user-data', () => ({
  INDUSTRIES: ['Technology', 'Finance', 'Healthcare'],
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
  // Exposes a control the tests can use to satisfy the Select's validator,
  // which the real Radix trigger can't drive in jsdom.
  Select: ({ children, onValueChange }: any) => (
    <div data-testid="select">
      <button type="button" data-testid="select-pick" onClick={() => onValueChange?.('Technology')}>
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

import { AddCompanyDialog } from '../add-company-dialog';

describe('AddCompanyDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when open', () => {
    const { container } = render(<AddCompanyDialog {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('does not render when closed', () => {
    const { queryByTestId } = render(<AddCompanyDialog {...defaultProps} open={false} />);
    expect(queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders Add Company title', () => {
    render(<AddCompanyDialog {...defaultProps} />);
    expect(screen.getByText('Add Company')).toBeInTheDocument();
  });

  it('renders Name field', () => {
    render(<AddCompanyDialog {...defaultProps} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders Industry field', () => {
    render(<AddCompanyDialog {...defaultProps} />);
    expect(screen.getByText('Industry')).toBeInTheDocument();
  });

  it('renders Website URL field', () => {
    render(<AddCompanyDialog {...defaultProps} />);
    expect(screen.getByText('Website URL')).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    render(<AddCompanyDialog {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders Save button', () => {
    render(<AddCompanyDialog {...defaultProps} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders name input placeholder', () => {
    render(<AddCompanyDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g Google')).toBeInTheDocument();
  });

  it('renders website input placeholder', () => {
    render(<AddCompanyDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g https://www.example.com')).toBeInTheDocument();
  });

  it('calls onOpenChange when Cancel is clicked', () => {
    render(<AddCompanyDialog {...defaultProps} />);
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
      fireEvent.change(screen.getByPlaceholderText('e.g Google'), {
        target: { value: 'Acme Inc' },
      });
      fireEvent.change(screen.getByPlaceholderText('e.g https://www.example.com'), {
        target: { value: 'https://acme.example.com' },
      });
      fireEvent.click(screen.getByTestId('select-pick'));
      await act(async () => {
        fireEvent.click(screen.getByText('Save'));
      });
    };

    beforeEach(() => {
      mockCreateState.isError = false;
      mockCreateUserCompany.mockResolvedValue({});
    });

    it('reports a rejected create request alongside the toast', async () => {
      mockCreateUserCompany.mockRejectedValue(new Error('service down'));
      render(<AddCompanyDialog {...defaultProps} />);

      await submit();

      expect(errorSpy).toHaveBeenCalledWith('Failed to create company:', expect.any(Error));
    });

    // The mutation resolves but the query state flags an error; the component
    // throws a named Error so the report says which request failed.
    it('reports a create request that comes back flagged as failed', async () => {
      mockCreateState.isError = true;
      render(<AddCompanyDialog {...defaultProps} />);

      await submit();

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to create company:',
        expect.objectContaining({ message: 'Create-company request reported an error' }),
      );
    });
  });
});
