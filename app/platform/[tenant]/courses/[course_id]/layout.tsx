import type React from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { fetchTenantSeoFlags } from '@/lib/utils/server-metadata';
import { getCourseSeoData } from '@/lib/utils/seo-data';
import {
  getSiteUrl,
  absoluteUrl,
  buildEntityMetadata,
  courseLd,
  breadcrumbLd,
} from '@/lib/utils/seo';
import { JsonLd } from '@/components/json-ld';
import { CourseLayoutClient } from './_components/course-layout-client';

type CourseParams = { tenant: string; course_id: string };

async function resolveCourseSeo(params: Promise<CourseParams>) {
  const { tenant, course_id } = await params;
  const courseKey = decodeURIComponent(course_id);
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = getSiteUrl(host, protocol);
  const canonicalUrl = baseUrl
    ? `${baseUrl}/platform/${tenant}/courses/${encodeURIComponent(courseKey)}`
    : undefined;

  const [course, seoFlags] = await Promise.all([
    getCourseSeoData(courseKey),
    fetchTenantSeoFlags(tenant),
  ]);

  return { tenant, courseKey, baseUrl, canonicalUrl, course, isPublic: seoFlags.isPublic };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<CourseParams>;
}): Promise<Metadata> {
  try {
    const { baseUrl, canonicalUrl, course, isPublic } = await resolveCourseSeo(params);
    if (!course) {
      // No course data — keep it out of the index and inherit root metadata.
      return { robots: { index: false, follow: false } };
    }
    return buildEntityMetadata({
      title: course.title,
      description: course.description,
      image: course.image || absoluteUrl('/opengraph-image', baseUrl),
      canonicalUrl,
      siteName: course.org || undefined,
      isPublic,
    });
  } catch {
    return { robots: { index: false, follow: false } };
  }
}

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<CourseParams>;
}) {
  let jsonLd: object[] = [];
  try {
    const { canonicalUrl, course, isPublic } = await resolveCourseSeo(params);
    // Only expose structured data for public tenants with resolvable course data.
    if (isPublic && course) {
      jsonLd = [
        courseLd({
          name: course.title,
          description: course.description,
          url: canonicalUrl,
          image: course.image,
          providerName: course.org || 'ibl.ai',
          inLanguage: course.language,
          price: course.price,
        }),
      ];
      if (canonicalUrl) {
        jsonLd.push(
          breadcrumbLd([
            { name: 'Courses', url: canonicalUrl.replace(/\/[^/]+$/, '') },
            { name: course.title, url: canonicalUrl },
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
      <CourseLayoutClient params={params}>{children}</CourseLayoutClient>
    </>
  );
}
