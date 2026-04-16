'use client';

// @ts-ignore
import { CourseContentTabPage } from '@iblai/iblai-js/web-containers/next';
import { config } from '@/lib/config';

export default function ProgressTab() {
  return (
    <CourseContentTabPage
      tab="progress"
      lmsUrl={config.urls.lms()}
      mfeUrl={config.urls.mfe()}
      legacyLmsUrl={config.urls.legacyLmsUrl()}
    />
  );
}
