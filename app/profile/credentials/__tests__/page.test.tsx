import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockFilteredCredentials: any[] = [];

vi.mock('@iblai/iblai-js/web-containers', () => ({
  useProfileCredentials: vi.fn(() => ({
    filteredCredentials: mockFilteredCredentials,
    isLoading: false,
    isError: false,
  })),
  CredentialMiniBoxSkeleton: () => <div data-testid="credential-skeleton" />,
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
  SkeletonMultiplier: () => <div data-testid="skeleton-multiplier" />,
}));

vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  CredentialDetailModal: ({ credential, onClose }: any) => (
    <div data-testid="credential-modal">
      <span>{credential?.entityId}</span>
      <button data-testid="close-modal" onClick={onClose}>
        Close
      </button>
    </div>
  ),
  CredentialMiniBox: ({ credential, onClick }: any) => (
    <div data-testid="credential-mini-box" onClick={onClick}>
      {credential.entityId}
    </div>
  ),
}));

import CredentialsPage from '../page';
import { useProfileCredentials } from '@iblai/iblai-js/web-containers';

describe('CredentialsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders credentials heading with count', () => {
    vi.mocked(useProfileCredentials).mockReturnValue({
      filteredCredentials: [{ entityId: 'cred-1' }, { entityId: 'cred-2' }],
      isLoading: false,
      isError: false,
    } as any);

    render(<CredentialsPage />);

    expect(screen.getByText('Credentials (2)')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<CredentialsPage />);

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('handles search input change', () => {
    render(<CredentialsPage />);

    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'aws' } });

    expect(input).toHaveValue('aws');
  });

  it('shows skeletons when loading', () => {
    vi.mocked(useProfileCredentials).mockReturnValue({
      filteredCredentials: [],
      isLoading: true,
      isError: false,
    } as any);

    render(<CredentialsPage />);

    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
  });

  it('shows empty box when no credentials and not loading', () => {
    vi.mocked(useProfileCredentials).mockReturnValue({
      filteredCredentials: [],
      isLoading: false,
      isError: false,
    } as any);

    render(<CredentialsPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No credentials found.');
  });

  it('renders credential cards when available', () => {
    vi.mocked(useProfileCredentials).mockReturnValue({
      filteredCredentials: [{ entityId: 'cred-1' }, { entityId: 'cred-2' }, { entityId: 'cred-3' }],
      isLoading: false,
      isError: false,
    } as any);

    render(<CredentialsPage />);

    expect(screen.getAllByTestId('credential-mini-box')).toHaveLength(3);
  });

  it('opens credential detail modal on click', () => {
    vi.mocked(useProfileCredentials).mockReturnValue({
      filteredCredentials: [{ entityId: 'cred-1' }],
      isLoading: false,
      isError: false,
    } as any);

    render(<CredentialsPage />);

    fireEvent.click(screen.getByTestId('credential-mini-box'));

    expect(screen.getByTestId('credential-modal')).toBeInTheDocument();
  });

  it('closes credential detail modal', () => {
    vi.mocked(useProfileCredentials).mockReturnValue({
      filteredCredentials: [{ entityId: 'cred-1' }],
      isLoading: false,
      isError: false,
    } as any);

    render(<CredentialsPage />);

    fireEvent.click(screen.getByTestId('credential-mini-box'));
    expect(screen.getByTestId('credential-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-modal'));
    expect(screen.queryByTestId('credential-modal')).not.toBeInTheDocument();
  });
});
