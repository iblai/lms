import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Same capture trick as the plain route's suite: the wizard is the SDK's, so
// what matters here is which agent the route hands it.
const { mockReplace, wizardProps, wizardMounts, searchParams, routeParams } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  wizardProps: { current: null as Record<string, any> | null },
  wizardMounts: { count: 0 },
  searchParams: { current: new URLSearchParams() },
  routeParams: { current: { agentId: 'agent-2' } as Record<string, unknown> },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/platform/test-tenant/onboarding/agent-2',
  useSearchParams: () => searchParams.current,
  useParams: () => routeParams.current,
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  OnboardingWizard: (props: Record<string, any>) => {
    wizardProps.current = props;
    // Counted on mount only, so a changed `key` (a fresh wizard) is
    // distinguishable from a re-render of the same one.
    React.useEffect(() => {
      wizardMounts.count += 1;
    }, []);
    return <div data-testid="onboarding-wizard">{props.tenant}</div>;
  },
  StepHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  onboardingPrimaryButtonClass: 'primary-cta',
  onboardingSecondaryButtonClass: 'secondary-cta',
  readUserOnboardingForm: (metadata: Record<string, any> | undefined) => {
    const form = metadata?.user_onboarding_form;
    return {
      enabled: form?.enabled === true,
      sections: form?.sections ?? [],
      agent: form?.agent ?? null,
    };
  },
  hasOnboardingContent: (form: Record<string, any>) =>
    (form.sections ?? []).some((section: any) => (section.fields?.length ?? 0) > 0) || !!form.agent,
}));

vi.mock('@/constants/global', () => ({
  NAVBAR_ONBOARDING_HEADER_ID: 'navbar-onboarding-header',
  ONBOARDING_FLOW_PARAM: 'flow',
  ONBOARDING_USER_FLOW: 'user',
  ONBOARDING_ADMIN_FLOW: 'admin',
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      mentor: () => 'https://mentor.example.com',
      auth: () => 'https://auth.example.com',
      lms: () => 'https://lms.example.com',
    },
  },
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({ metadata: null })),
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: vi.fn(() => 'test-tenant'),
}));

vi.mock('@/utils/helpers', () => ({ getUserName: vi.fn(() => 'jane') }));

vi.mock('@/utils/localstorage', () => ({ useIsAdmin: vi.fn(() => false) }));

import OnboardingAgentPage from '../page';
import { useIsAdmin } from '@/utils/localstorage';

describe('OnboardingAgentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wizardProps.current = null;
    wizardMounts.count = 0;
    searchParams.current = new URLSearchParams();
    routeParams.current = { agentId: 'agent-2' };
    vi.mocked(useIsAdmin).mockReturnValue(false);
  });

  it('hands the wizard the agent named in the route', () => {
    render(<OnboardingAgentPage />);

    expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument();
    expect(wizardProps.current).toMatchObject({ tenant: 'test-tenant', agentId: 'agent-2' });
  });

  it('runs the member flow — an agent link is a member link', () => {
    render(<OnboardingAgentPage />);

    expect(wizardProps.current!.isAdminOnboarding).toBe(false);
    // The member flow closes on the agent, so the host must not override it.
    expect(wizardProps.current!.renderFinalStep).toBeUndefined();
  });

  it('keeps an admin on the member flow rather than their own setup flow', () => {
    // The link was aimed at an audience; an admin following it is looking at
    // what that audience gets.
    vi.mocked(useIsAdmin).mockReturnValue(true);

    render(<OnboardingAgentPage />);

    expect(wizardProps.current!.isAdminOnboarding).toBe(false);
    // Still a preview though — it must not file the admin's own submission.
    expect(wizardProps.current!.onResponsesSubmit).toBeInstanceOf(Function);
  });

  it('still lets an admin switch to the setup flow from an agent link', () => {
    vi.mocked(useIsAdmin).mockReturnValue(true);
    searchParams.current = new URLSearchParams('flow=admin');

    render(<OnboardingAgentPage />);

    expect(wizardProps.current!.isAdminOnboarding).toBe(true);
  });

  it('decodes an id that was escaped into the path', () => {
    routeParams.current = { agentId: 'agent%2Fone' };

    render(<OnboardingAgentPage />);

    expect(wizardProps.current!.agentId).toBe('agent/one');
  });

  it('takes the first segment when the router hands back an array', () => {
    routeParams.current = { agentId: ['agent-3', 'extra'] };

    render(<OnboardingAgentPage />);

    expect(wizardProps.current!.agentId).toBe('agent-3');
  });

  it('leaves the agent unset when the route param is missing', () => {
    // Falls back to the tenant's first configured agent, as the plain route.
    routeParams.current = {};

    render(<OnboardingAgentPage />);

    expect(wizardProps.current!.agentId).toBeUndefined();
  });

  it('remounts the wizard per agent so no run inherits another', () => {
    const { rerender } = render(<OnboardingAgentPage />);
    expect(wizardMounts.count).toBe(1);

    routeParams.current = { agentId: 'agent-9' };
    rerender(<OnboardingAgentPage />);

    expect(wizardProps.current!.agentId).toBe('agent-9');
    // A second mount, not a re-render: the moved-to agent starts at step one
    // with no answers carried over from the previous link.
    expect(wizardMounts.count).toBe(2);
  });

  it('keeps the same wizard when nothing about the run changes', () => {
    // The remount is keyed on the run, not on every render — a re-render must
    // not throw away the member's progress.
    const { rerender } = render(<OnboardingAgentPage />);
    rerender(<OnboardingAgentPage />);

    expect(wizardMounts.count).toBe(1);
  });

  it('remounts when an admin switches to the setup flow', () => {
    vi.mocked(useIsAdmin).mockReturnValue(true);
    const { rerender } = render(<OnboardingAgentPage />);
    expect(wizardProps.current!.isAdminOnboarding).toBe(false);

    searchParams.current = new URLSearchParams('flow=admin');
    rerender(<OnboardingAgentPage />);

    expect(wizardProps.current!.isAdminOnboarding).toBe(true);
    // The two flows are different wizards; neither inherits the other's step.
    expect(wizardMounts.count).toBe(2);
  });

  it('lands the member on the dashboard when they finish', () => {
    render(<OnboardingAgentPage />);

    wizardProps.current!.onComplete();

    expect(mockReplace).toHaveBeenCalledWith('/platform/test-tenant/home');
  });
});
