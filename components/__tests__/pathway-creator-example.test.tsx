import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../create-pathway-modal', () => ({
  CreatePathwayModal: ({ open, onOpenChange, onSave }: any) =>
    open ? (
      <div data-testid="create-pathway-modal">
        <button onClick={() => onSave({ name: 'Test' })}>Save</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

import { PathwayCreatorExample } from '../pathway-creator-example';

describe('PathwayCreatorExample', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PathwayCreatorExample />);
    expect(screen.getByText('My Pathways')).toBeInTheDocument();
  });

  it('renders Create Pathway button', () => {
    render(<PathwayCreatorExample />);
    expect(screen.getByText('Create Pathway')).toBeInTheDocument();
  });

  it('does not show modal initially', () => {
    render(<PathwayCreatorExample />);
    expect(screen.queryByTestId('create-pathway-modal')).not.toBeInTheDocument();
  });

  it('opens modal when Create Pathway is clicked', () => {
    render(<PathwayCreatorExample />);
    fireEvent.click(screen.getByText('Create Pathway'));
    expect(screen.getByTestId('create-pathway-modal')).toBeInTheDocument();
  });

  it('closes modal when close is clicked', () => {
    render(<PathwayCreatorExample />);
    fireEvent.click(screen.getByText('Create Pathway'));
    expect(screen.getByTestId('create-pathway-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('create-pathway-modal')).not.toBeInTheDocument();
  });

  it('handles save pathway', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<PathwayCreatorExample />);
    fireEvent.click(screen.getByText('Create Pathway'));
    fireEvent.click(screen.getByText('Save'));
    expect(consoleSpy).toHaveBeenCalledWith('Saving pathway:', { name: 'Test' });
    consoleSpy.mockRestore();
  });
});
