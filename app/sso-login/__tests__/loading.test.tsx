import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@iblai/iblai-js/web-containers', () => ({
  Loader: () => <div data-testid="loader" />,
}));

import SsoLoginLoading from '../loading';

describe('SsoLoginLoading', () => {
  it('renders without crashing', () => {
    render(<SsoLoginLoading />);
  });

  it('renders the loader', () => {
    render(<SsoLoginLoading />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });
});
