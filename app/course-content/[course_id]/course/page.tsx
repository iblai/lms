'use client';

// @ts-ignore
import { CourseContentTabPage } from '@iblai/iblai-js/web-containers/next';
import { config } from '@/lib/config';

export default function CourseTab() {
  return (
    <CourseContentTabPage
      tab="course"
      lmsUrl={config.urls.lms()}
      mfeUrl={config.urls.mfe()}
      legacyLmsUrl={config.urls.legacyLmsUrl()}
    />
  );
}
