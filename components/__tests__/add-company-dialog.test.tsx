import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

vi.mock('@/services/career', () => ({
  useCreateUserCompanyMutation: vi.fn(() => [vi.fn(), { isError: false }]),
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
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
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
});
