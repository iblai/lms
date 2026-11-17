import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockHandle402Error = vi.fn(async () => {});
const mockDispatch = vi.fn();
let mockSubscription = { openPricingModal: false, openContactAdminModal: false };

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ subscription: mockSubscription }),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  use402ErrorCheck: () => ({ handle402Error: mockHandle402Error }),
  setOpenPricingModal: (open: boolean) => ({
    type: 'subscription/setOpenPricingModal',
    payload: open,
  }),
  setOpenContactAdminModal: (open: boolean) => ({
    type: 'subscription/setOpenContactAdminModal',
    payload: open,
  }),
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  UpgradePackageModal: (props: any) => (
    <div
      data-testid="plan-picker"
      data-redirect={props.redirectUrl}
      data-main={props.mainPlatformKey}
      data-source={props.sourcePlatformKey}
      data-email={props.currentUserEmail}
    >
      <button onClick={props.onClose}>close picker</button>
    </div>
  ),
  ContactAdminModal: (props: any) => (
    <div data-testid="contact-admin">
      <button onClick={props.onClose}>close notice</button>
    </div>
  ),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: { auth: () => 'https://auth.example.com' },
    settings: { mainPlatformKey: () => 'main' },
  },
}));

vi.mock('@/hooks/use-tenant-param', () => ({ useTenantParam: () => 'acme' }));
vi.mock('@/utils/helpers', () => ({ getUserEmail: () => 'learner@example.com' }));

import { CreditExhaustionHandler, CREDIT_EXHAUSTION_EVENT } from '../credit-exhaustion-handler';

const frame = {
  type: 'credits.exhausted',
  audience: 'trial',
  error: 'Insufficient balance',
  message: 'Soft limit hit',
  pricing_table: {
    pricing_table_id: 'prc_1',
    publishable_key: 'pk_test',
    client_reference_id: 'ref_1',
  },
};

const dispatchFrame = (detail: unknown) =>
  act(() => {
    document.dispatchEvent(new CustomEvent(CREDIT_EXHAUSTION_EVENT, { detail, bubbles: true }));
  });

describe('CreditExhaustionHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscription = { openPricingModal: false, openContactAdminModal: false };
  });

  it("feeds the agent's frame to the SDK's 402 routing", () => {
    render(<CreditExhaustionHandler />);

    dispatchFrame(frame);

    expect(mockHandle402Error).toHaveBeenCalledWith({
      error: frame.error,
      message: frame.message,
      pricing_table: frame.pricing_table,
    });
  });

  it('ignores an event that carries no frame', () => {
    render(<CreditExhaustionHandler />);

    dispatchFrame(undefined);
    dispatchFrame('credits.exhausted');

    expect(mockHandle402Error).not.toHaveBeenCalled();
  });

  it('stops listening once unmounted', () => {
    const { unmount } = render(<CreditExhaustionHandler />);
    unmount();

    dispatchFrame(frame);

    expect(mockHandle402Error).not.toHaveBeenCalled();
  });

  it('renders nothing while no credits flow is open', () => {
    const { container } = render(<CreditExhaustionHandler />);

    expect(container).toBeEmptyDOMElement();
  });

  it('opens the plan picker for this tenant when the slice says so, and closes it through the slice', () => {
    mockSubscription = { openPricingModal: true, openContactAdminModal: false };
    render(<CreditExhaustionHandler />);

    const picker = screen.getByTestId('plan-picker');
    expect(picker).toHaveAttribute('data-redirect', 'https://auth.example.com/login');
    expect(picker).toHaveAttribute('data-main', 'main');
    expect(picker).toHaveAttribute('data-source', 'acme');
    expect(picker).toHaveAttribute('data-email', 'learner@example.com');

    fireEvent.click(screen.getByText('close picker'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'subscription/setOpenPricingModal',
      payload: false,
    });
  });

  it('opens the contact-admin notice when the slice says so, and closes it through the slice', () => {
    mockSubscription = { openPricingModal: false, openContactAdminModal: true };
    render(<CreditExhaustionHandler />);

    expect(screen.getByTestId('contact-admin')).toBeInTheDocument();

    fireEvent.click(screen.getByText('close notice'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'subscription/setOpenContactAdminModal',
      payload: false,
    });
  });
});
