import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/constants/assets', () => ({
  CREDENTIAL_DEFAULT_IMG: '/images/credentials/default_badge.png',
}));

vi.mock('dayjs', () => {
  const dayjs = (date: any) => ({
    format: () => 'Jan 1, 2024',
  });
  dayjs.default = dayjs;
  return { default: dayjs };
});

vi.mock('@iblai/iblai-api', () => ({}));

import { CredentialsListBox } from '../credentials-list-box';

describe('CredentialsListBox', () => {
  const mockCredentials = [
    {
      credentialDetails: {
        name: 'Credential A',
        iconImage: '/icon-a.png',
      },
      course: {
        name: 'Course A',
      },
      issuedOn: '2024-01-01',
    },
    {
      credentialDetails: {
        name: 'Credential B',
        iconImage: '/icon-b.png',
      },
      course: {
        name: 'Course B',
      },
      issuedOn: '2024-02-01',
    },
  ] as any[];

  it('renders without crashing', () => {
    const { container } = render(<CredentialsListBox credentials={mockCredentials} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the Credentials heading', () => {
    render(<CredentialsListBox credentials={mockCredentials} />);
    expect(screen.getByText('Credentials')).toBeInTheDocument();
  });

  it('renders the Add Credential link', () => {
    render(<CredentialsListBox credentials={mockCredentials} />);
    const addLink = screen.getByLabelText('Add Credential');
    expect(addLink).toHaveAttribute('href', '/discover');
  });

  it('renders the Add Credential tooltip text', () => {
    render(<CredentialsListBox credentials={mockCredentials} />);
    expect(screen.getByText('Add Credential')).toBeInTheDocument();
  });

  it('renders credential items when credentials are provided', () => {
    render(<CredentialsListBox credentials={mockCredentials} />);
    expect(screen.getByText('Credential A')).toBeInTheDocument();
    expect(screen.getByText('Credential B')).toBeInTheDocument();
  });

  it('shows empty message when no credentials', () => {
    render(<CredentialsListBox credentials={[]} />);
    // DefaultEmptyBox is rendered with message "No credentials yet."
    // Since we're not mocking DefaultEmptyBox, it renders the actual component
    expect(screen.getByText('No credentials yet.')).toBeInTheDocument();
  });

  it('renders correct number of credential items', () => {
    render(<CredentialsListBox credentials={mockCredentials} />);
    const credentialNames = screen.getAllByText(/Credential [AB]/);
    expect(credentialNames).toHaveLength(2);
  });

  it('renders credential icons', () => {
    render(<CredentialsListBox credentials={mockCredentials} />);
    expect(screen.getByAltText('Credential A')).toBeInTheDocument();
    expect(screen.getByAltText('Credential B')).toBeInTheDocument();
  });

  it('renders issued dates for credentials', () => {
    render(<CredentialsListBox credentials={mockCredentials} />);
    const dates = screen.getAllByText('Earned on: Jan 1, 2024');
    expect(dates.length).toBe(2);
  });

  it('passes minified=true to CredentialMiniBox', () => {
    // When minified, course name should not be shown
    render(<CredentialsListBox credentials={mockCredentials} />);
    expect(screen.queryByText('Course A')).not.toBeInTheDocument();
    expect(screen.queryByText('Course B')).not.toBeInTheDocument();
  });
});
