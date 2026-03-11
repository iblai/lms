'use client';
import { config } from '@/lib/config';
import { getTenant, getUserName } from '@/utils/helpers';
// @ts-ignore
import { useGetReportedSkillsQuery } from '@iblai/iblai-js/data-layer';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { Spinner } from '@/components/spinner';

export default function Home() {
  const {
    metadata,
    isLoading: isLoadingMetadata,
    isError: isErrorMetadata,
  } = useTenantMetadata({
    org: getTenant(),
  });
  const startPageEnabled =
    config.settings.startPageEnabled() && metadata?.enable_start_screen_display === true;
  const {
    isLoading: isLoadingReportedSkills,
    isError: isErrorGetReportedSkills,
    error: errorGetReportedSkills,
  } = useGetReportedSkillsQuery([
    {
      org: getTenant(),
      // @ts-expect-error - user may not be part of useGetReportedSkillsQuery Query definition
      userId: getUserName(),
    },
  ]);

  useEffect(() => {
    // Wait for metadata to load before making any redirect decisions
    if (isLoadingMetadata) {
      return;
    }

    // On metadata error, redirect to home
    if (isErrorMetadata) {
      redirect('/home');
    }

    if (!startPageEnabled) {
      redirect('/home');
    }

    if (!isLoadingReportedSkills) {
      if (
        isErrorGetReportedSkills &&
        (errorGetReportedSkills as { status: number })?.status === 400
      ) {
        redirect('/start');
      } else {
        redirect('/home');
      }
    }
  }, [
    isLoadingMetadata,
    isErrorMetadata,
    isLoadingReportedSkills,
    startPageEnabled,
    isErrorGetReportedSkills,
    errorGetReportedSkills,
  ]);

  if (isLoadingMetadata || isLoadingReportedSkills) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-14 w-14 text-[var(--primary)]" />
      </div>
    );
  }

  return null;
}
