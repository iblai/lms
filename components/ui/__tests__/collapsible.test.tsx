import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../collapsible';

describe('Collapsible', () => {
  it('renders without crashing', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>,
    );
    expect(screen.getByText('Toggle')).toBeInTheDocument();
  });
});
