'use client';

// @ts-ignore
import { CourseContentTabPage } from '@iblai/iblai-js/web-containers/next';
import { config } from '@/lib/config';

export default function BookmarksTab() {
  return (
    <CourseContentTabPage
      tab="bookmarks"
      lmsUrl={config.urls.lms()}
      mfeUrl={config.urls.mfe()}
      legacyLmsUrl={config.urls.legacyLmsUrl()}
    />
  );
}
