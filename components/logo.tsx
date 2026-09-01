'use client';

import Image from 'next/image';
import Link from 'next/link';
import { config } from '@/lib/config';
import { useEffect, useState } from 'react';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { cn } from '@/lib/utils';

export function Logo({
  width = 120,
  height = 40,
  className,
}: {
  variant?: 'main' | 'small' | 'footer';
  width?: number;
  height?: number;
  className?: string;
}) {
  const tenant = useTenantParam();
  const { metadata } = useTenantMetadata({
    org: tenant,
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const loadLogo = async () => {
    setLogoUrl(
      metadata?.auth_web_skillsai?.display_logo ||
        `${config.urls.dm()}/api/core/orgs/${tenant}/logo/`,
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
        className={cn('h-6 w-auto sm:h-7 md:h-8', className)}
        //onError={handleLogoError}
      />
    </Link>
  );
}
