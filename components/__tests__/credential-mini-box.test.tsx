import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('@/constants/assets', () => ({
  CREDENTIAL_DEFAULT_IMG: '/images/credentials/default_badge.png',
}));

vi.mock('dayjs', () => {
  const dayjs = (date: any) => ({
    format: (_fmt: string) => (date ? 'Jan 1, 2024' : '-'),
  });
  dayjs.default = dayjs;
  return { default: dayjs };
});

vi.mock('@iblai/iblai-api', () => ({}));

import { CredentialMiniBox } from '../credential-mini-box';

describe('CredentialMiniBox', () => {
  const defaultCredential = {
    credentialDetails: {
      name: 'Test Credential',
      iconImage: '/test-icon.png',
    },
    course: {
      name: 'Test Course',
    },
    issuedOn: '2024-01-01',
  } as any;

  it('renders without crashing', () => {
    const { container } = render(<CredentialMiniBox credential={defaultCredential} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the credential name', () => {
    render(<CredentialMiniBox credential={defaultCredential} />);
    expect(screen.getByText('Test Credential')).toBeInTheDocument();
  });

  it('renders the course name when not minified', () => {
    render(<CredentialMiniBox credential={defaultCredential} />);
    expect(screen.getByText('Test Course')).toBeInTheDocument();
  });

  it('hides the course name when minified', () => {
    render(<CredentialMiniBox credential={defaultCredential} minified={true} />);
    expect(screen.queryByText('Test Course')).not.toBeInTheDocument();
  });

  it('renders the issued date', () => {
    render(<CredentialMiniBox credential={defaultCredential} />);
    expect(screen.getByText('Earned on: Jan 1, 2024')).toBeInTheDocument();
  });

  it('shows dash when issuedOn is missing', () => {
    const credNoDate = { ...defaultCredential, issuedOn: undefined };
    render(<CredentialMiniBox credential={credNoDate} />);
    expect(screen.getByText('Earned on: -')).toBeInTheDocument();
  });

  it('renders the credential icon', () => {
    render(<CredentialMiniBox credential={defaultCredential} />);
    const img = screen.getByAltText('Test Credential');
    expect(img).toHaveAttribute('src', '/test-icon.png');
  });

  it('uses default image when iconImage is missing', () => {
    const credNoIcon = {
      ...defaultCredential,
      credentialDetails: { ...defaultCredential.credentialDetails, iconImage: null },
    };
    render(<CredentialMiniBox credential={credNoIcon} />);
    const img = screen.getByAltText('Test Credential');
    expect(img).toHaveAttribute('src', '/images/credentials/default_badge.png');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<CredentialMiniBox credential={defaultCredential} onClick={handleClick} />);
    fireEvent.click(screen.getByText('Test Credential'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('uses default noop onClick', () => {
    // Should not throw
    const { container } = render(<CredentialMiniBox credential={defaultCredential} />);
    fireEvent.click(container.firstChild!);
  });

  it('renders with custom iconSize', () => {
    render(<CredentialMiniBox credential={defaultCredential} iconSize={24} />);
    const img = screen.getByAltText('Test Credential');
    expect(img).toHaveAttribute('width', '24');
    expect(img).toHaveAttribute('height', '24');
  });

  it('uses default credential name when name is missing', () => {
    const credNoName = {
      ...defaultCredential,
      credentialDetails: { ...defaultCredential.credentialDetails, name: null },
    };
    render(<CredentialMiniBox credential={credNoName} />);
    const img = screen.getByAltText('Credential');
    expect(img).toBeInTheDocument();
  });
});
