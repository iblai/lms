'use client';

import Image from 'next/image';
import Link from 'next/link';
import { config } from '@/lib/config';
import { useEffect, useState } from 'react';
import { getTenant } from '@/utils/helpers';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

export function Logo({
  width = 120,
  height = 40,
}: {
  variant?: 'main' | 'small' | 'footer';
  width?: number;
  height?: number;
}) {
  const { metadata } = useTenantMetadata({
    org: getTenant(),
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const loadLogo = async () => {
    setLogoUrl(
      metadata?.auth_web_skillsai?.display_logo ||
        `${config.urls.dm()}/api/core/orgs/${getTenant()}/logo/`,
    );
  };

  useEffect(() => {
    loadLogo();
  }, []);

  /* function handleLogoError() {
    setLogoUrl('/images/iblai-logo.png');
  } */

  return (
    <Link href="/" className="flex items-center">
      <Image
        src={logoUrl || '/images/iblai-logo.png'}
        loading="lazy"
        alt={config.settings.appName()}
        width={width}
        height={height}
        className="h-6 w-auto sm:h-7 md:h-8" // Reduced from h-8 sm:h-9 md:h-11
        //onError={handleLogoError}
      />
    </Link>
  );
}
