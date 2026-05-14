import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

const mockDispatch = vi.fn();
const mockSelector = vi.fn();
vi.mock('@/lib/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (fn: any) => mockSelector(fn),
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  TopBanner: vi.fn(() => <div data-testid="top-banner" />),
  PaywallModal: vi.fn(
    ({ open, onClose, pricing, platformKey, itemId, itemType, closable }: any) => (
      <div
        data-testid="paywall-modal"
        data-open={open}
        data-pricing={JSON.stringify(pricing)}
        data-platform-key={platformKey}
        data-item-id={itemId}
        data-item-type={itemType}
        data-closable={closable}
      >
        <button data-testid="paywall-close" onClick={onClose}>
          close
        </button>
      </div>
    ),
  ),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  setDisplayMonetizationCheckoutModal: vi.fn((payload) => ({
    type: 'setDisplayMonetizationCheckoutModal',
    payload,
  })),
}));

import { MonetizationWrapper } from '../monetization-wrapper';
import { MONETIZATION_CLOSE_PAYLOAD } from '@/constants/global';

const buildState = (overrides: Partial<any> = {}) => ({
  displayMonetizationCheckoutModal: true,
  accessCheckResponse: {
    pricing: { amount: 9.99, currency: 'USD' },
    item_id: 'course-1',
    item_type: 'course',
  },
  paywallClosable: true,
  onClosePayload: undefined,
  ...overrides,
});

describe('MonetizationWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelector.mockImplementation((fn: any) => fn({ monetization: buildState() }));
  });

  it('renders the PaywallModal when modal is enabled and pricing is available', () => {
    render(<MonetizationWrapper />);
    const modal = screen.getByTestId('paywall-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('data-open', 'true');
    expect(modal).toHaveAttribute('data-platform-key', 'test-tenant');
    expect(modal).toHaveAttribute('data-item-id', 'course-1');
    expect(modal).toHaveAttribute('data-item-type', 'course');
    expect(modal).toHaveAttribute('data-closable', 'true');
  });

  it('renders nothing when displayMonetizationCheckoutModal is false', () => {
    mockSelector.mockImplementation((fn: any) =>
      fn({ monetization: buildState({ displayMonetizationCheckoutModal: false }) }),
    );
    const { container } = render(<MonetizationWrapper />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when accessCheckResponse has no pricing', () => {
    mockSelector.mockImplementation((fn: any) =>
      fn({
        monetization: buildState({
          accessCheckResponse: { pricing: undefined, item_id: 'x', item_type: 'y' },
        }),
      }),
    );
    const { container } = render(<MonetizationWrapper />);
    expect(container.firstChild).toBeNull();
  });

  it('dispatches setDisplayMonetizationCheckoutModal(false) when modal is closed', () => {
    render(<MonetizationWrapper />);
    fireEvent.click(screen.getByTestId('paywall-close'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'setDisplayMonetizationCheckoutModal',
      payload: false,
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to /error/402 when onClosePayload is redirect_402', () => {
    mockSelector.mockImplementation((fn: any) =>
      fn({
        monetization: buildState({
          onClosePayload: MONETIZATION_CLOSE_PAYLOAD.redirect_402,
        }),
      }),
    );
    render(<MonetizationWrapper />);
    fireEvent.click(screen.getByTestId('paywall-close'));
    expect(mockPush).toHaveBeenCalledWith('/error/402');
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('uses cached accessCheckResponse after Redux clears it', () => {
    let state = buildState();
    mockSelector.mockImplementation((fn: any) => fn({ monetization: state }));

    const { rerender } = render(<MonetizationWrapper />);
    expect(screen.getByTestId('paywall-modal')).toBeInTheDocument();

    state = buildState({ accessCheckResponse: null });
    rerender(<MonetizationWrapper />);
    const modal = screen.getByTestId('paywall-modal');
    expect(modal).toHaveAttribute('data-item-id', 'course-1');
    expect(modal).toHaveAttribute('data-item-type', 'course');
  });
});
