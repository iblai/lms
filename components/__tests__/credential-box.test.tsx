import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

import { CredentialBox } from '../credential-box';

describe('CredentialBox', () => {
  const defaultProps = {
    name: 'Test Credential',
    image: '/test-credential.png',
    issuedOn: 'Jan 1, 2024',
  };

  it('renders without crashing', () => {
    const { container } = render(<CredentialBox {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the credential name', () => {
    render(<CredentialBox {...defaultProps} />);
    expect(screen.getByText('Test Credential')).toBeInTheDocument();
  });

  it('renders the issued date', () => {
    render(<CredentialBox {...defaultProps} />);
    expect(screen.getByText('Earned on: Jan 1, 2024')).toBeInTheDocument();
  });

  it('renders the credential image', () => {
    render(<CredentialBox {...defaultProps} />);
    const img = screen.getByAltText('Test Credential');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test-credential.png');
  });

  it('renders with different name', () => {
    render(<CredentialBox {...defaultProps} name="Advanced Certificate" />);
    expect(screen.getByText('Advanced Certificate')).toBeInTheDocument();
  });

  it('renders with different date', () => {
    render(<CredentialBox {...defaultProps} issuedOn="Dec 25, 2023" />);
    expect(screen.getByText('Earned on: Dec 25, 2023')).toBeInTheDocument();
  });

  it('renders with different image', () => {
    render(<CredentialBox {...defaultProps} image="/other-image.png" />);
    const img = screen.getByAltText('Test Credential');
    expect(img).toHaveAttribute('src', '/other-image.png');
  });

  it('has cursor-pointer class', () => {
    const { container } = render(<CredentialBox {...defaultProps} />);
    expect(container.firstChild).toHaveClass('cursor-pointer');
  });
});
