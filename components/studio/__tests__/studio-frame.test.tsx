import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetSsoToken = vi.fn();
vi.mock('@/services/edx-sso', () => ({
  useLazyGetEdxSSOTokenQuery: () => [mockGetSsoToken],
}));
const mockGetUserName = vi.fn();
vi.mock('@/utils/helpers', () => ({ getUserName: () => mockGetUserName() }));
const mockIsSameSite = vi.fn();
vi.mock('@/utils/studio', () => ({
  studioAuthoringUrl: (courseKey: string) =>
    `https://apps.example.com/authoring/course/${courseKey}`,
  edxSsoLoginUrl: (code: string, redirectUrl: string) =>
    `https://learn.example.com/login?code=${code}&redirect_url=${redirectUrl}`,
  isSameSite: (...args: unknown[]) => mockIsSameSite(...args),
}));

import { StudioFrame } from '../studio-frame';

const COURSE_KEY = 'course-v1:org+CS101+2026';
const AUTHORING_URL = `https://apps.example.com/authoring/course/${COURSE_KEY}`;
const unwrapResolve = (value: unknown) => ({ unwrap: () => Promise.resolve(value) });
const unwrapReject = (error: unknown) => ({ unwrap: () => Promise.reject(error) });

describe('StudioFrame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserName.mockReturnValue('jane');
    mockIsSameSite.mockReturnValue(true);
    mockGetSsoToken.mockReturnValue(unwrapResolve({ sso_auth_token: 'tok' }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('enters the authoring page through the SSO login with a fresh token', async () => {
    render(<StudioFrame courseId={COURSE_KEY} />);

    expect(screen.getByTestId('studio-frame-loading')).toBeInTheDocument();
    const frame = await screen.findByTitle('Course outline in Studio');
    expect(frame).toHaveAttribute(
      'src',
      `https://learn.example.com/login?code=tok&redirect_url=${AUTHORING_URL}`,
    );
    expect(mockGetSsoToken).toHaveBeenCalledWith({ username: 'jane', redirect_url: AUTHORING_URL });
    expect(screen.getByText('Build the course outline, units and components.')).toBeInTheDocument();
  });

  it('always offers the authoring page in a new tab', () => {
    render(<StudioFrame courseId={COURSE_KEY} />);
    const link = screen.getByText('Open in a new tab').closest('a');
    expect(link).toHaveAttribute('href', AUTHORING_URL);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('warns that the frame may be blocked when Studio is on another site', async () => {
    mockIsSameSite.mockReturnValue(false);
    render(<StudioFrame courseId={COURSE_KEY} />);
    expect(await screen.findByText(/your browser is blocking Studio/)).toBeInTheDocument();
  });

  it('falls back to a message when no token comes back', async () => {
    mockGetSsoToken.mockReturnValue(unwrapResolve({}));
    mockGetUserName.mockReturnValue(null);
    render(<StudioFrame courseId={COURSE_KEY} />);

    expect(await screen.findByText(/couldn't sign you into Studio/)).toBeInTheDocument();
    expect(screen.queryByTitle('Course outline in Studio')).not.toBeInTheDocument();
    expect(mockGetSsoToken).toHaveBeenCalledWith({ username: '', redirect_url: AUTHORING_URL });
  });

  it('falls back to a message when the token request fails', async () => {
    mockGetSsoToken.mockReturnValue(unwrapReject(new Error('nope')));
    render(<StudioFrame courseId={COURSE_KEY} />);
    expect(await screen.findByText(/couldn't sign you into Studio/)).toBeInTheDocument();
  });

  it('ignores a token that resolves after unmount', async () => {
    let resolve: (value: unknown) => void = () => {};
    mockGetSsoToken.mockReturnValue({ unwrap: () => new Promise((done) => (resolve = done)) });
    const { unmount } = render(<StudioFrame courseId={COURSE_KEY} />);
    unmount();
    resolve({ sso_auth_token: 'late' });
    await waitFor(() => expect(mockGetSsoToken).toHaveBeenCalledTimes(1));
  });

  it('ignores a failure that arrives after unmount', async () => {
    let reject: (error: unknown) => void = () => {};
    mockGetSsoToken.mockReturnValue({
      unwrap: () => new Promise((_done, fail) => (reject = fail)),
    });
    const { unmount } = render(<StudioFrame courseId={COURSE_KEY} />);
    unmount();
    reject(new Error('late'));
    await waitFor(() => expect(console.error).toHaveBeenCalled());
  });
});
