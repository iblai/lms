import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

import { CreatePathwayDialog } from '../create-pathway-dialog';

/** Clicks an item row in the content list (avoids ambiguity once it also appears in Selected Content). */
function clickContentInList(name: string) {
  const label = screen.getAllByText(name).find((el) => el.closest('.cursor-pointer'));
  if (!label) throw new Error(`Could not find list row for: ${name}`);
  fireEvent.click(label);
}

describe('CreatePathwayDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when open', () => {
    const { container } = render(<CreatePathwayDialog {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('does not render when closed', () => {
    const { queryByTestId } = render(<CreatePathwayDialog {...defaultProps} open={false} />);
    expect(queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders Create New Pathway title', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    expect(screen.getByText('Create New Pathway')).toBeInTheDocument();
  });

  it('renders Pathway Name section', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    expect(screen.getByText('Pathway Name')).toBeInTheDocument();
  });

  it('renders Description section', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders Subject section', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    expect(screen.getByText('Subject')).toBeInTheDocument();
  });

  it('renders Content section', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    // "Content" appears multiple times (section header + content items)
    const contentHeaders = screen.getAllByText('Content');
    expect(contentHeaders.length).toBeGreaterThanOrEqual(1);
  });

  it('renders pathway name input', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('Enter pathway name')).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('Enter pathway description')).toBeInTheDocument();
  });

  it('renders content search input', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search for content to add')).toBeInTheDocument();
  });

  it('renders Create Pathway button', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    expect(screen.getByText('Create Pathway')).toBeInTheDocument();
  });

  it('disables Create Pathway button when name is empty', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    const createButton = screen.getByText('Create Pathway');
    expect(createButton).toBeDisabled();
  });

  it('enables Create Pathway button when name is entered', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('Enter pathway name');
    fireEvent.change(nameInput, { target: { value: 'Test Pathway' } });
    const createButton = screen.getByText('Create Pathway');
    expect(createButton).not.toBeDisabled();
  });

  it('renders available content items', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    expect(screen.getByText('Leadership Development')).toBeInTheDocument();
    expect(screen.getByText('Strategic Management')).toBeInTheDocument();
    expect(screen.getByText('Data-Driven Decision Making')).toBeInTheDocument();
  });

  it('filters content based on search', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search for content to add');
    fireEvent.change(searchInput, { target: { value: 'Leadership' } });
    expect(screen.getByText('Leadership Development')).toBeInTheDocument();
    expect(screen.queryByText('Time Management')).not.toBeInTheDocument();
  });

  it('shows no content found message when search has no results', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search for content to add');
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } });
    expect(screen.getByText(/No content found matching/)).toBeInTheDocument();
  });

  it('adds content when clicking on a content item', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    clickContentInList('Leadership Development');
    // Should show "Selected Content:" label
    expect(screen.getByText('Selected Content:')).toBeInTheDocument();
    expect(screen.getAllByText('Leadership Development').length).toBeGreaterThanOrEqual(1);
  });

  it('removes selected content when remove button is clicked', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    clickContentInList('Leadership Development');
    expect(screen.getByText('Selected Content:')).toBeInTheDocument();
    // Find the remove button (X) in the selected content tag
    const selectedTag = screen.getByText('Selected Content:').parentElement;
    const removeButtons = selectedTag?.querySelectorAll('button');
    if (removeButtons && removeButtons.length > 0) {
      fireEvent.click(removeButtons[0]);
    }
    expect(screen.queryByText('Selected Content:')).not.toBeInTheDocument();
  });

  it('does not add duplicate content', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    clickContentInList('Leadership Development');
    clickContentInList('Leadership Development');
    // Should still only have it listed once in selected content
    const selectedSection = screen.getByText('Selected Content:').parentElement;
    const tags = selectedSection?.querySelectorAll('button');
    expect(tags?.length).toBe(1);
  });

  it('calls onSave with data when Create Pathway is clicked', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('Enter pathway name');
    fireEvent.change(nameInput, { target: { value: 'My Pathway' } });
    fireEvent.click(screen.getByText('Create Pathway'));
    expect(defaultProps.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Pathway' }),
    );
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes when X button is clicked', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    // The X close button in the header
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find((btn) => btn.textContent === '');
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    }
  });

  it('updates description textarea', () => {
    render(<CreatePathwayDialog {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Enter pathway description');
    fireEvent.change(textarea, { target: { value: 'A test description' } });
    expect(textarea).toHaveValue('A test description');
  });
});
