import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CredentialMiniBoxSkeleton } from '../skeleton-credential-mini-box';

describe('CredentialMiniBoxSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<CredentialMiniBoxSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
