import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('../account-dialog', () => ({
  AccountDialog: ({ open, onOpenChange, onSave, initialInfo }: any) =>
    open ? (
      <div data-testid="account-dialog">
        <button onClick={() => onSave(initialInfo)}>Save</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

import { AccountButton } from '../account-button';

describe('AccountButton', () => {
  it('renders without crashing', () => {
    const { container } = render(<AccountButton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the Account text', () => {
    render(<AccountButton />);
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('renders the settings button', () => {
    render(<AccountButton />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('does not show dialog initially', () => {
    render(<AccountButton />);
    expect(screen.queryByTestId('account-dialog')).not.toBeInTheDocument();
  });

  it('opens the account dialog when clicked', () => {
    render(<AccountButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('account-dialog')).toBeInTheDocument();
  });

  it('closes the dialog when Close is clicked', () => {
    render(<AccountButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('account-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('account-dialog')).not.toBeInTheDocument();
  });

  it('calls onSave and updates account info when Save is clicked', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<AccountButton />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Save'));
    expect(consoleSpy).toHaveBeenCalledWith('Saved account info:', expect.any(Object));
    consoleSpy.mockRestore();
  });
});
