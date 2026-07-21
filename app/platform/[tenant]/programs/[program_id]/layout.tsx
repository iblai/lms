import type React from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { SelfLinkingGuard } from '@/components/self-linking-guard';
import { fetchTenantSeoFlags } from '@/lib/utils/server-metadata';
import { getProgramSeoData } from '@/lib/utils/seo-data';
import {
  getSiteUrl,
  absoluteUrl,
  buildEntityMetadata,
  courseLd,
  breadcrumbLd,
} from '@/lib/utils/seo';
import { JsonLd } from '@/components/json-ld';

type ProgramParams = { tenant: string; program_id: string };

async function resolveProgramSeo(params: Promise<ProgramParams>) {
  const { tenant, program_id } = await params;
  const programId = decodeURIComponent(program_id);
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = getSiteUrl(host, protocol);
  const canonicalUrl = baseUrl
    ? `${baseUrl}/platform/${tenant}/programs/${encodeURIComponent(programId)}`
    : undefined;

  // The program's own org isn't known server-side; fall back to the tenant.
  const [program, seoFlags] = await Promise.all([
    getProgramSeoData(programId, tenant),
    fetchTenantSeoFlags(tenant),
  ]);

  return { tenant, programId, baseUrl, canonicalUrl, program, isPublic: seoFlags.isPublic };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ProgramParams>;
}): Promise<Metadata> {
  try {
    const { baseUrl, canonicalUrl, program, isPublic } = await resolveProgramSeo(params);
    if (!program) {
      return { robots: { index: false, follow: false } };
    }
    return buildEntityMetadata({
      title: program.title,
      description: program.description,
      image: program.image || absoluteUrl('/opengraph-image', baseUrl),
      canonicalUrl,
      isPublic,
    });
  } catch {
    return { robots: { index: false, follow: false } };
  }
}

export default async function ProgramLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<ProgramParams>;
}) {
  let jsonLd: object[] = [];
  try {
    const { canonicalUrl, program, isPublic } = await resolveProgramSeo(params);
    if (isPublic && program) {
      jsonLd = [
        courseLd({
          name: program.title,
          description: program.description,
          url: canonicalUrl,
          image: program.image,
          providerName: program.org || 'ibl.ai',
          inLanguage: program.language,
        }),
      ];
      if (canonicalUrl) {
        jsonLd.push(
          breadcrumbLd([
            { name: 'Programs', url: canonicalUrl.replace(/\/[^/]+$/, '') },
            { name: program.title, url: canonicalUrl },
          ]),
        );
      }
    }
  } catch {
    jsonLd = [];
  }

  return (
    <>
      {jsonLd.length > 0 && <JsonLd data={jsonLd} />}
      <SelfLinkingGuard>{children}</SelfLinkingGuard>
    </>
  );
}
