import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/utils/helpers', () => ({
  isRecommendedTabHidden: vi.fn(() => false),
}));

import RecommendedLayout from '../layout';
import { isRecommendedTabHidden } from '@/utils/helpers';

describe('RecommendedLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when recommended tab is not hidden', () => {
    vi.mocked(isRecommendedTabHidden).mockReturnValue(false);
    render(
      <RecommendedLayout>
        <span>test child</span>
      </RecommendedLayout>,
    );
    expect(screen.getByText('test child')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to /home when recommended tab is hidden', () => {
    vi.mocked(isRecommendedTabHidden).mockReturnValue(true);
    const { container } = render(
      <RecommendedLayout>
        <span>test child</span>
      </RecommendedLayout>,
    );
    expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/home');
    expect(container.innerHTML).toBe('');
  });
});
