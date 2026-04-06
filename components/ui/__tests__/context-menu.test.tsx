import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '../context-menu';

describe('ContextMenu', () => {
  it('renders trigger without crashing', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right click me</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Item 1</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(screen.getByText('Right click me')).toBeInTheDocument();
  });
});
