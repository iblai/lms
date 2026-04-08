import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Avatar, AvatarImage, AvatarFallback } from '../avatar';

describe('Avatar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.png" alt="avatar" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
