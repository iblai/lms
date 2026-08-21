'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { PartyPopper } from 'lucide-react';
import {
  OnboardingWizard,
  StepHeader,
  onboardingPrimaryButtonClass,
  onboardingSecondaryButtonClass,
  type OnboardingFinalStepContext,
  type OnboardingStepHeader,
} from '@iblai/iblai-js/web-containers';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { config } from '@/lib/config';
import { NAVBAR_ONBOARDING_HEADER_ID, ONBOARDING_FLOW_PARAM } from '@/constants/global';
import { resolveOnboardingFlow } from '@/lib/onboarding-flow';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { getUserName } from '@/utils/helpers';
import { useIsAdmin } from '@/utils/localstorage';

/**
 * The platform's one onboarding route, which flow it runs decided by who is
 * looking:
 *
 *   - **Members** get the tenant's user onboarding — what its admins set up in
 *     the admin panel (tenant metadata `user_onboarding_form`), rendered by the
 *     SDK wizard in user mode. With nothing configured, the wizard says so
 *     rather than leaving them on a blank screen.
 *   - **Admins** get that same member flow by default, since it is what their
 *     platform actually shows people, and switch to the first-run setup flow
 *     (organization → sector → invite team → wrap-up) from the navbar, which
 *     drives the `?flow=` param this page reads. A tenant with no member
 *     onboarding configured lands them on the setup flow instead.
 *
 * Distinct from `/platform/[tenant]/start`, the built-in learner start screen.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = useTenantParam();
  const isAdmin = useIsAdmin();
  const { metadata } = useTenantMetadata({ org: tenant });
  // Which flow runs: the member one unless an admin has switched away from it
  // (or the tenant has configured none). Set by the navbar's admin-only switch.
  const flow = resolveOnboardingFlow({
    isAdmin,
    flowParam: searchParams?.get(ONBOARDING_FLOW_PARAM),
    metadata,
  });

  // Same brand-name resolution the learner start screen uses; falls through to
  // the wizard's own default when the tenant sets neither.
  const brandName =
    metadata?.auth_web_skillsai?.display_title_info || metadata?.platform_name || undefined;

  const userFlow = flow === 'user';
  // An admin in the member flow is looking at what members get, not filing
  // their own onboarding.
  const previewing = isAdmin && userFlow;

  return (
    // A little breathing room between the navbar and the wizard's progress row.
    // flex-1 + min-h-0 rather than a plain padded box: the member flow's agent
    // step uses a `h-full` shell, which needs an ancestor with a real height to
    // stretch into.
    <div className="flex min-h-0 flex-1 flex-col pt-4" data-testid="onboarding-page">
      <OnboardingWizard
        // Remounts on the switch so neither flow inherits the other's step or
        // answers — they are different wizards behind one entry point.
        key={userFlow ? 'user' : 'admin'}
        tenant={tenant}
        username={getUserName()}
        brandName={brandName}
        isAdminOnboarding={!userFlow}
        // The member flow's closing step embeds the admin-picked agent through
        // `agent-ai`; auth is relied on the host, so it needs the app's URLs.
        agentEmbed={{
          mentorUrl: config.urls.mentor(),
          authUrl: config.urls.auth(),
          lmsUrl: config.urls.lms(),
        }}
        // The setup flow ships no final screen, so the host owns it. The member
        // flow has its own (the agent), so leave it to the SDK.
        renderFinalStep={userFlow ? undefined : (context) => <CompletionStep {...context} />}
        // The member flow's step heading belongs in the navbar here, leaving the
        // step's own space to the questions (or the agent).
        renderStepHeader={
          userFlow ? (header: OnboardingStepHeader) => <NavbarStepHeader {...header} /> : undefined
        }
        // A preview must not file the admin's own onboarding submission.
        onResponsesSubmit={previewing ? async () => {} : undefined}
        // Onboarding is a one-way door — replace so Back does not re-enter it.
        onComplete={() => router.replace(`/platform/${tenant}/home`)}
      />
    </div>
  );
}

/**
 * The member flow's step heading, rendered into the navbar's left cluster
 * instead of above the step: the step's icon in the flow's gradient tile, then
 * the title with its subtitle beneath.
 *
 * Portalled rather than lifted into a shared layout because the NavBar lives in
 * an ancestor layout — the same trick the course-content layout uses for its
 * navbar controls. The slot is resolved in an effect, so it is in the DOM by
 * the time this renders into it; until then the heading simply is not shown.
 */
function NavbarStepHeader({ icon: Icon, title, subtitle }: OnboardingStepHeader) {
  const [slot, setSlot] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    setSlot(document.getElementById(NAVBAR_ONBOARDING_HEADER_ID));
  }, []);

  if (!slot) return null;

  return createPortal(
    <div className="flex min-w-0 items-center gap-2.5" data-testid="onboarding-navbar-header">
      {Icon ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#93C5FD] text-white">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--navbar-text)]">{title}</p>
        {subtitle ? (
          <p className="truncate text-xs text-[var(--navbar-text)] opacity-60">{subtitle}</p>
        ) : null}
      </div>
    </div>,
    slot,
  );
}

/**
 * Final step of the ADMIN flow. The SDK ships no final screen, so the host owns
 * it: a plain wrap-up naming the workspace, with Complete finalizing onboarding.
 *
 * No agent here on purpose — the MEMBER flow closes on the admin-picked agent
 * (see `agentEmbed`), and the admin already reaches theirs from the chat
 * launcher, so repeating it would only stall the setup flow.
 */
function CompletionStep({ answers, goBack, complete }: OnboardingFinalStepContext) {
  const workspace = answers.organizationName || 'Your workspace';

  return (
    <div data-testid="onboarding-completion-step">
      <StepHeader
        icon={PartyPopper}
        title="You're all set"
        subtitle={`${workspace} is ready. Head to the dashboard to explore courses, programs, and analytics.`}
      />
      <div className="space-y-3">
        <button type="button" onClick={() => complete()} className={onboardingPrimaryButtonClass}>
          Complete
        </button>
        <button type="button" onClick={goBack} className={onboardingSecondaryButtonClass}>
          Back
        </button>
      </div>
    </div>
  );
}
