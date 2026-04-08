import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '../hover-card';

describe('HoverCard', () => {
  it('renders trigger without crashing', () => {
    render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Card content</HoverCardContent>
      </HoverCard>,
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });
});
