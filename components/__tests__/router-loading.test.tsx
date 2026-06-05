import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockRouter = { push: vi.fn(), back: vi.fn() };

vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  useRouter: () => mockRouter,
}));

import { RouterLoading } from '../router-loading';

describe('RouterLoading', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <RouterLoading>
        <div>Child content</div>
      </RouterLoading>,
    );
    expect(container).toBeTruthy();
  });

  it('renders children when router is ready', () => {
    render(
      <RouterLoading>
        <div>Child content</div>
      </RouterLoading>,
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});
