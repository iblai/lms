import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Capture the props the page hands the SDK wizard so the final step and the
// completion target can be exercised without driving all four wizard steps.
const { mockReplace, wizardProps, searchParams } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  wizardProps: { current: null as Record<string, any> | null },
  // The navbar's switch drives this; the page only reads it.
  searchParams: { current: new URLSearchParams() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/platform/test-tenant/onboarding',
  useSearchParams: () => searchParams.current,
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  OnboardingWizard: (props: Record<string, any>) => {
    wizardProps.current = props;
    return <div data-testid="onboarding-wizard">{props.tenant}</div>;
  },
  StepHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  ),
  onboardingPrimaryButtonClass: 'primary-cta',
  onboardingSecondaryButtonClass: 'secondary-cta',
  // Real readers: which flow the page picks depends on what these say about
  // the tenant's metadata, so stubbing them away would test nothing.
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

vi.mock('@/utils/helpers', () => ({
  getUserName: vi.fn(() => 'jane'),
}));

vi.mock('@/utils/localstorage', () => ({
  useIsAdmin: vi.fn(() => true),
}));

import OnboardingPage from '../page';

/** Tenant metadata with a member onboarding an admin would land on. */
const configuredOnboarding = {
  user_onboarding_form: {
    version: 1,
    enabled: true,
    sections: [],
    agent: { mentor_unique_id: 'agent-1', name: 'Guide' },
  },
};
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useIsAdmin } from '@/utils/localstorage';

/** Render the page, then render whatever `renderFinalStep` returns. */
function renderFinalStep(context: Record<string, any> = {}) {
  render(<OnboardingPage />);
  const finalStep = wizardProps.current!.renderFinalStep({
    tenant: 'test-tenant',
    username: 'jane',
    answers: { organizationName: 'Acme University', sector: 'higher_education' },
    goBack: vi.fn(),
    complete: vi.fn(),
    ...context,
  });
  return render(<>{finalStep}</>);
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wizardProps.current = null;
    searchParams.current = new URLSearchParams();
    vi.mocked(useTenantParam).mockReturnValue('test-tenant');
    vi.mocked(useTenantMetadata).mockReturnValue({ metadata: null } as any);
    // The suite below drives the admin flow; the member flow has its own.
    vi.mocked(useIsAdmin).mockReturnValue(true);
  });

  it('gives the wizard top spacing without breaking its height contract', () => {
    render(<OnboardingPage />);

    // pt for the breathing room; flex-1 + min-h-0 so the agent step's `h-full`
    // shell still has a real height to stretch into.
    expect(screen.getByTestId('onboarding-page')).toHaveClass(
      'pt-4',
      'flex',
      'flex-1',
      'min-h-0',
      'flex-col',
    );
  });

  it('renders the SDK wizard with the tenant and username', () => {
    render(<OnboardingPage />);

    expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument();
    expect(wizardProps.current).toMatchObject({ tenant: 'test-tenant', username: 'jane' });
  });

  it('prefers the tenant display title for the brand name', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: {
        auth_web_skillsai: { display_title_info: 'Acme Academy' },
        platform_name: 'Acme',
      },
    } as any);

    render(<OnboardingPage />);

    expect(wizardProps.current!.brandName).toBe('Acme Academy');
  });

  it('falls back to the platform name when no display title is set', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({ metadata: { platform_name: 'Acme' } } as any);

    render(<OnboardingPage />);

    expect(wizardProps.current!.brandName).toBe('Acme');
  });

  it("leaves brandName unset so the wizard's default applies when metadata has neither", () => {
    render(<OnboardingPage />);

    expect(wizardProps.current!.brandName).toBeUndefined();
  });

  it('reads the tenant metadata for the tenant in the URL', () => {
    vi.mocked(useTenantParam).mockReturnValue('acme');

    render(<OnboardingPage />);

    expect(useTenantMetadata).toHaveBeenCalledWith({ org: 'acme' });
  });

  it('replaces the history entry with the tenant dashboard on complete', () => {
    vi.mocked(useTenantParam).mockReturnValue('acme');
    render(<OnboardingPage />);

    wizardProps.current!.onComplete();

    expect(mockReplace).toHaveBeenCalledWith('/platform/acme/home');
  });

  it('names the organization from the answers on the final step', () => {
    renderFinalStep();

    expect(screen.getByRole('heading', { name: "You're all set" })).toBeInTheDocument();
    expect(screen.getByText(/Acme University is ready/)).toBeInTheDocument();
  });

  it('falls back to a generic workspace label when no organization was given', () => {
    renderFinalStep({ answers: { organizationName: '', sector: null } });

    expect(screen.getByText(/Your workspace is ready/)).toBeInTheDocument();
  });

  it("closes the setup flow without an agent — that is the member flow's job", () => {
    const { container } = renderFinalStep();

    expect(container.querySelector('agent-ai')).toBeNull();
    expect(container.querySelector('[data-testid="onboarding-completion-step"]')).not.toBeNull();
  });

  it('finalizes onboarding from the Complete button', () => {
    const complete = vi.fn();
    renderFinalStep({ complete });

    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));

    expect(complete).toHaveBeenCalled();
  });

  it('returns to the previous step from the back button', () => {
    const goBack = vi.fn();
    renderFinalStep({ goBack });

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(goBack).toHaveBeenCalled();
  });
});

describe('OnboardingPage — who sees which flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wizardProps.current = null;
    searchParams.current = new URLSearchParams();
    vi.mocked(useTenantParam).mockReturnValue('test-tenant');
    vi.mocked(useTenantMetadata).mockReturnValue({ metadata: null } as any);
  });

  /** The navbar's switch previews the member flow by setting `?flow=user`. */
  function previewUserFlow() {
    searchParams.current = new URLSearchParams('flow=user');
  }

  it('runs the member flow for a non-admin, with no switch to the setup flow', () => {
    vi.mocked(useIsAdmin).mockReturnValue(false);

    render(<OnboardingPage />);

    expect(wizardProps.current!.isAdminOnboarding).toBe(false);
    // The member flow owns its final screen (the agent) — the host must not
    // override it with the admin flow's "Meet your assistant" step.
    expect(wizardProps.current!.renderFinalStep).toBeUndefined();
  });

  it('ignores the preview param for a non-admin — members get their own flow', () => {
    vi.mocked(useIsAdmin).mockReturnValue(false);
    previewUserFlow();

    render(<OnboardingPage />);

    // Same flow either way, but persistence stays real: a member answering is
    // not a preview.
    expect(wizardProps.current!.isAdminOnboarding).toBe(false);
    expect(wizardProps.current!.onResponsesSubmit).toBeUndefined();
  });

  it("hands the member flow this app's URLs for the closing agent step", () => {
    vi.mocked(useIsAdmin).mockReturnValue(false);

    render(<OnboardingPage />);

    expect(wizardProps.current!.agentEmbed).toEqual({
      mentorUrl: 'https://mentor.example.com',
      authUrl: 'https://auth.example.com',
      lmsUrl: 'https://lms.example.com',
    });
  });

  it("saves a member's answers for real and lands them on the dashboard", () => {
    vi.mocked(useIsAdmin).mockReturnValue(false);
    vi.mocked(useTenantParam).mockReturnValue('acme');

    render(<OnboardingPage />);

    // No persistence override — the SDK writes the tenant metadata itself.
    expect(wizardProps.current!.onResponsesSubmit).toBeUndefined();

    wizardProps.current!.onComplete();
    expect(mockReplace).toHaveBeenCalledWith('/platform/acme/home');
  });

  it('starts an admin on the setup flow', () => {
    vi.mocked(useIsAdmin).mockReturnValue(true);

    render(<OnboardingPage />);

    expect(wizardProps.current!.isAdminOnboarding).toBe(true);
    expect(wizardProps.current!.renderFinalStep).toBeInstanceOf(Function);
  });

  it('runs the member flow for an admin once the navbar sets the preview param', () => {
    vi.mocked(useIsAdmin).mockReturnValue(true);
    previewUserFlow();

    render(<OnboardingPage />);

    expect(wizardProps.current!.isAdminOnboarding).toBe(false);
    expect(wizardProps.current!.renderFinalStep).toBeUndefined();
  });

  it("puts the member flow's step heading in the navbar, not above the step", () => {
    vi.mocked(useIsAdmin).mockReturnValue(false);
    // The navbar renders this slot on every page; stand it up for the portal.
    const slot = document.createElement('div');
    slot.id = 'navbar-onboarding-header';
    document.body.appendChild(slot);

    render(<OnboardingPage />);

    const header = wizardProps.current!.renderStepHeader({
      icon: (props: Record<string, unknown>) => <svg data-testid="step-icon" {...props} />,
      title: 'Assessment test',
      subtitle: 'Take your test now',
    });
    render(<>{header}</>);

    // Icon, title and subtitle all land inside the navbar slot.
    const rendered = slot.querySelector('[data-testid="onboarding-navbar-header"]') as HTMLElement;
    expect(rendered).not.toBeNull();
    expect(rendered).toHaveTextContent('Assessment test');
    expect(rendered).toHaveTextContent('Take your test now');
    expect(rendered.querySelector('[data-testid="step-icon"]')).not.toBeNull();

    slot.remove();
  });

  it('leaves the admin setup flow to render its own headings', () => {
    vi.mocked(useIsAdmin).mockReturnValue(true);

    render(<OnboardingPage />);

    expect(wizardProps.current!.renderStepHeader).toBeUndefined();
  });

  it('does not file a submission when an admin looks at the member flow', async () => {
    vi.mocked(useIsAdmin).mockReturnValue(true);
    previewUserFlow();

    render(<OnboardingPage />);

    // The admin is looking at what members get, not answering as one.
    await act(() => wizardProps.current!.onResponsesSubmit({ about: { role: 'Teacher' } }));

    act(() => wizardProps.current!.onComplete(null));

    expect(mockReplace).toHaveBeenCalledWith('/platform/test-tenant/home');
  });

  it('defaults an admin to the member flow when the tenant has one configured', () => {
    vi.mocked(useIsAdmin).mockReturnValue(true);
    vi.mocked(useTenantMetadata).mockReturnValue({ metadata: configuredOnboarding } as any);

    render(<OnboardingPage />);

    // What the platform actually shows people is what the admin sees first.
    expect(wizardProps.current!.isAdminOnboarding).toBe(false);
    expect(wizardProps.current!.onResponsesSubmit).toBeInstanceOf(Function);
  });

  it('sends an admin to the setup flow when the tenant has no member onboarding', () => {
    vi.mocked(useIsAdmin).mockReturnValue(true);
    vi.mocked(useTenantMetadata).mockReturnValue({ metadata: { platform_name: 'Acme' } } as any);

    render(<OnboardingPage />);

    expect(wizardProps.current!.isAdminOnboarding).toBe(true);
  });

  it('lets an admin switch to the setup flow even when a member one exists', () => {
    vi.mocked(useIsAdmin).mockReturnValue(true);
    vi.mocked(useTenantMetadata).mockReturnValue({ metadata: configuredOnboarding } as any);
    searchParams.current = new URLSearchParams('flow=admin');

    render(<OnboardingPage />);

    expect(wizardProps.current!.isAdminOnboarding).toBe(true);
  });

  it('keeps members on the member flow whatever the param says', () => {
    vi.mocked(useIsAdmin).mockReturnValue(false);
    searchParams.current = new URLSearchParams('flow=admin');

    render(<OnboardingPage />);

    expect(wizardProps.current!.isAdminOnboarding).toBe(false);
  });
});
