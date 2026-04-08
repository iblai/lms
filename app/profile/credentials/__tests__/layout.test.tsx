import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CredentialsLayout from '../layout';

describe('CredentialsLayout', () => {
  it('renders children', () => {
    render(
      <CredentialsLayout>
        <span>test child</span>
      </CredentialsLayout>,
    );
    expect(screen.getByText('test child')).toBeInTheDocument();
  });
});
