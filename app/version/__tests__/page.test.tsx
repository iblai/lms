import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  Version: ({ appName, appVersion, poweredBy }: any) => (
    <div data-testid="version">
      <span data-testid="app-name">{appName}</span>
      <span data-testid="app-version">{appVersion}</span>
      <div data-testid="powered-by">{poweredBy}</div>
    </div>
  ),
}));

vi.mock('@/lib/version', () => ({
  appVersion: '1.0.0-test',
}));

import AppVersion from '../page';

describe('AppVersion', () => {
  it('renders the Version component with appName="Skills"', () => {
    render(<AppVersion />);

    expect(screen.getByTestId('app-name')).toHaveTextContent('Skills');
  });

  it('passes the appVersion from lib/version', () => {
    render(<AppVersion />);

    expect(screen.getByTestId('app-version')).toHaveTextContent('1.0.0-test');
  });

  it('renders the ibl.ai logo as poweredBy', () => {
    render(<AppVersion />);

    const poweredBy = screen.getByTestId('powered-by');
    const logo = poweredBy.querySelector('img');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/iblai-logo.png');
    expect(logo).toHaveAttribute('alt', 'ibl.ai');
  });
});
