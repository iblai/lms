import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/tenant-redirect', () => ({
  TenantRedirect: () => <div data-testid="tenant-redirect" />,
}));

import Page from '../page';

describe('legacy tenant redirect page', () => {
  it('renders the TenantRedirect stub', () => {
    render(<Page />);
    expect(screen.getByTestId('tenant-redirect')).toBeInTheDocument();
  });
});
