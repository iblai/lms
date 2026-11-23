'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLazyGetEdxSSOTokenQuery } from '@/services/edx-sso';
import { getUserName } from '@/utils/helpers';
import { edxSsoLoginUrl, isSameSite, studioAuthoringUrl } from '@/utils/studio';

/**
 * Studio's own authoring page for a course (outline, units, xblocks), embedded.
 * The frame is entered through the edX SSO login view with a freshly minted
 * one-time code, so the author is signed into Studio without a detour.
 */
export function StudioFrame({ courseId }: { courseId: string }) {
  const [getSsoToken] = useLazyGetEdxSSOTokenQuery();
  const authoringUrl = studioAuthoringUrl(courseId);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [crossSite, setCrossSite] = useState(false);

  useEffect(() => {
    setCrossSite(!isSameSite(window.location.href, authoringUrl));
  }, [authoringUrl]);

  useEffect(() => {
    let cancelled = false;
    setFrameUrl(null);
    setFailed(false);
    getSsoToken({ username: getUserName() ?? '', redirect_url: authoringUrl })
      .unwrap()
      .then(({ sso_auth_token }) => {
        if (cancelled) return;
        if (sso_auth_token) setFrameUrl(edxSsoLoginUrl(sso_auth_token, authoringUrl));
        else setFailed(true);
      })
      .catch((error) => {
        console.error('Failed to start a Studio session:', error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authoringUrl, getSsoToken]);

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="studio-frame">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-2">
        <p className="text-sm text-gray-500">
          {crossSite
            ? 'If the outline does not load, your browser is blocking Studio inside this page. Open it in a new tab instead.'
            : 'Build the course outline, units and components.'}
        </p>
        <a
          href={authoringUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800"
        >
          Open in a new tab
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
      {failed ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-600">
          We couldn&apos;t sign you into Studio here. Use &ldquo;Open in a new tab&rdquo; to edit
          the outline.
        </div>
      ) : frameUrl ? (
        <iframe
          src={frameUrl}
          title="Course outline in Studio"
          className="min-h-0 w-full flex-1 border-0"
          allow="clipboard-read; clipboard-write; fullscreen"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center" data-testid="studio-frame-loading">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
