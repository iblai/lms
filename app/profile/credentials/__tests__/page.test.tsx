import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockFilteredCredentials: any[] = [];

vi.mock('@/hooks/profile/use-profile-credentials', () => ({
  useProfileCredentials: vi.fn(() => ({
    filteredCredentials: mockFilteredCredentials,
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('@/components/credential-detail-modal', () => ({
  CredentialDetailModal: ({ credential, onClose }: any) => (
    <div data-testid="credential-modal">
      <span>{credential?.entityId}</span>
      <button data-testid="close-modal" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock('@/components/skeleton-multiplier', () => ({
  SkeletonMultiplier: () => <div data-testid="skeleton-multiplier" />,
}));

vi.mock('@/components/skeleton-credential-mini-box', () => ({
  CredentialMiniBoxSkeleton: () => <div data-testid="credential-skeleton" />,
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

vi.mock('@/components/credential-mini-box', () => ({
  CredentialMiniBox: ({ credential, onClick }: any) => (
    <div data-testid="credential-mini-box" onClick={onClick}>
      {credential.entityId}
    </div>
  ),
}));

import CredentialsPage from '../page';
import { useProfileCredentials } from '@/hooks/profile/use-profile-credentials';

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
