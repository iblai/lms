import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// The course iframe — stub it; the URL building lives in useEdxIframe and is
// covered by its own tests.
vi.mock('@/components/edx-iframe/edx-iframe', () => ({
  EdxIframe: () => <div data-testid="edx-iframe" />,
}));

import GradebookTab from '../page';

describe('GradebookTab', () => {
  it('renders the edX iframe', () => {
    render(<GradebookTab />);
    expect(screen.getByTestId('edx-iframe')).toBeInTheDocument();
  });
});
