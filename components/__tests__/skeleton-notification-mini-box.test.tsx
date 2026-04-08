import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonNotificationMiniBox } from '../skeleton-notification-mini-box';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('SkeletonNotificationMiniBox', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonNotificationMiniBox />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
