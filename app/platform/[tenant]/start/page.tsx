'use client';

import OnboardingFlow from '@/components/onboarding';
import { Spinner } from '@/components/spinner';
import { config } from '@/lib/config';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { redirect } from 'next/navigation';

export default function StartOnboarding() {
  const tenant = useTenantParam();
  const {
    metadata,
    isLoading: isLoadingMetadata,
    isError: isErrorMetadata,
  } = useTenantMetadata({
    org: tenant,
  });

  const startPageEnabled =
    config.settings.startPageEnabled() && metadata?.enable_start_screen_display === true;

  if (!startPageEnabled || isErrorMetadata) {
    redirect(`/${tenant}/home`);
  }

  if (isLoadingMetadata) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-14 w-14 text-[var(--primary)]" />
      </div>
    );
  }

  return <OnboardingFlow />;
}
