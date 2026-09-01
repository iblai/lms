import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Popover, PopoverAnchor, PopoverTrigger, PopoverContent } from '../popover';

describe('Popover', () => {
  it('renders trigger without crashing', () => {
    render(
      <Popover>
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText('Open popover')).toBeInTheDocument();
  });

  it('renders anchor children without crashing', () => {
    render(
      <Popover>
        <PopoverAnchor>
          <span>Anchored element</span>
        </PopoverAnchor>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText('Anchored element')).toBeInTheDocument();
  });

  it('shows content positioned against the anchor when open', () => {
    render(
      <Popover open>
        <PopoverAnchor>
          <span>Anchored element</span>
        </PopoverAnchor>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText('Anchored element')).toBeInTheDocument();
    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });
});
