import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const useUserDisplayName = vi.fn();
vi.mock('@/hooks/users/use-user-display-name', () => ({
  useUserDisplayName: (...args: unknown[]) => useUserDisplayName(...args),
}));

import { UserDisplayName } from '../user-display-name';

describe('UserDisplayName', () => {
  it('renders the resolved name inline with the given class', () => {
    useUserDisplayName.mockReturnValue('Ada Lovelace');
    render(<UserDisplayName username="ada" fallback="ada@x.org" className="font-medium" />);
    expect(useUserDisplayName).toHaveBeenCalledWith('ada', 'ada@x.org');
    const name = screen.getByTestId('user-display-name');
    expect(name.tagName).toBe('SPAN');
    expect(name).toHaveTextContent('Ada Lovelace');
    expect(name).toHaveClass('font-medium');
  });
});
