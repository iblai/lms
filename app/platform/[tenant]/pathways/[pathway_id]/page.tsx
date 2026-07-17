'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import _ from 'lodash';
import { toast } from 'sonner';

import { PathwayCompletionResponse } from '@iblai/iblai-api';
import {
  // @ts-ignore
  useLazyGetPathwayCompletionQuery,
  // @ts-ignore
  useLazyGetUserEnrolledPathwaysQuery,
  // @ts-ignore
  useCreateCatalogPathwaySelfEnrollmentMutation,
  // @ts-ignore
  useLazyGetPathwayListQuery,
} from '@iblai/iblai-js/data-layer';
import { isLoggedIn } from '@iblai/iblai-js/web-utils';

import { DefaultEmptyBox } from '@/components/default-empty-box';
import { DiscoverContentCard } from '@/components/discover-content-card';
import { config } from '@/lib/config';
import { usePersonnalizedCatalog } from '@/hooks/search/use-personnalized-catalog';
import { getRandomCourseImage, getUserName, handleNotLoggedInAction } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';

/**
 * Pathway detail page — mirrors the program detail page's layout: the
 * pathway's content as catalog-style boxes on the left, banner image /
 * Enroll CTA / progress in a sticky sidebar on the right. Replaces the
 * old PathwayDetailModal.
 */
export default function PathwayDetailPage() {
  const params = useParams();
  const pathwayId = decodeURIComponent(params.pathway_id as string);
  const tenant = useTenantParam();
  const userIsLoggedIn = isLoggedIn();

  const { handleSearch } = usePersonnalizedCatalog({ isLoggedIn: userIsLoggedIn });
  const [getUserEnrolledPathways, { isLoading: isEnrollmentLoading }] =
    useLazyGetUserEnrolledPathwaysQuery();
  const [getPathwayCompletion] = useLazyGetPathwayCompletionQuery();
  const [getPathwayList] = useLazyGetPathwayListQuery();
  const [
    createCatalogPathwaySelfEnrollment,
    { isError: isEnrollmentError, isSuccess: isEnrollmentSuccess },
  ] = useCreateCatalogPathwaySelfEnrollmentMutation();

  const [pathway, setPathway] = useState<Record<string, any> | null>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'failure'>('loading');
  const [enrollmentStatus, setEnrollmentStatus] = useState<boolean>(false);
  const [pathwayCompletion, setPathwayCompletion] = useState<PathwayCompletionResponse | null>(
    null,
  );
  const [isEnrollmentSubmitting, setIsEnrollmentSubmitting] = useState(false);
  const [randomImage] = useState(() => getRandomCourseImage());

  /** Pathway content items with resolved course images. */
  const paths: any[] = Array.isArray(pathway?.path)
    ? pathway.path.map((course: any) => ({
        ...course,
        edx_data: {
          ...course?.edx_data,
          course_image_asset_path: course?.edx_data?.course_image_asset_path
            ? config.urls.lms() + course.edx_data.course_image_asset_path
            : '',
        },
      }))
    : [];

  const handleEnrollIntoPathway = async () => {
    if (isEnrollmentSubmitting || !pathway) return;
    try {
      setIsEnrollmentSubmitting(true);
      await createCatalogPathwaySelfEnrollment([
        {
          requestBody: {
            // @ts-ignore — the API accepts pathway_uuid (same shape the old
            // PathwayDetailModal sent), the generated type only knows pathway_id.
            pathway_uuid: pathway.pathway_uuid || '',
            pathway_key: pathway.platform_key || '',
            username: getUserName(),
            active: true,
          },
        },
      ]);
      if (isEnrollmentError) {
        throw new Error('Failed to enroll into pathway');
      }
      toast.success('Enrolled into pathway successfully');
      setEnrollmentStatus(true);
      setTimeout(() => setIsEnrollmentSubmitting(false), 500);
    } catch {
      toast.error('Failed to enroll into pathway');
      setIsEnrollmentSubmitting(false);
    }
  };

  const handleFetchCompletion = async () => {
    try {
      const response = await getPathwayCompletion([
        { pathwayUuid: pathwayId, username: getUserName() },
      ]);
      setPathwayCompletion(response.data as PathwayCompletionResponse);
    } catch {
      setPathwayCompletion(null);
    }
  };

  const handleFetchEnrollmentStatus = async () => {
    try {
      const response = await getUserEnrolledPathways([
        { username: getUserName(), pathwayUuid: pathwayId },
      ]);
      setEnrollmentStatus(
        Array.isArray(response.data) &&
          response.data.findIndex((pre: any) => pre.active && pre?.pathway_uuid === pathwayId) !==
            -1,
      );
    } catch {
      setEnrollmentStatus(false);
    }
  };

  useEffect(() => {
    if (!pathwayId) return;
    let cancelled = false;
    const fetchPathway = async () => {
      setLoadingState('loading');
      try {
        // Catalog search first (works for any visible pathway), then the
        // user pathway list (covers enrolled/own pathways the search may
        // not index).
        const searchResponse = await handleSearch({
          username: getUserName(),
          content: ['pathways'],
          pathwayId,
          returnItems: true,
          returnFacet: false,
          limit: 50,
          tenant,
        });
        let rawResult = (searchResponse?.data as any)?.results?.[0];
        if (!rawResult) {
          const listResponse = await getPathwayList([
            { pathwayUuid: pathwayId, username: getUserName() },
          ]);
          rawResult = Array.isArray(listResponse?.data) ? listResponse.data[0] : undefined;
        }
        // Catalog search wraps results as `{ type, data }` — unwrap to the
        // pathway payload.
        const normalized = rawResult?.type && rawResult?.data ? rawResult.data : rawResult;
        if (cancelled) return;
        if (normalized) {
          setPathway(normalized);
          setLoadingState('success');
        } else {
          setLoadingState('failure');
        }
      } catch {
        if (cancelled) return;
        setLoadingState('failure');
      }
    };
    fetchPathway();
    return () => {
      cancelled = true;
    };
  }, [pathwayId]);

  useEffect(() => {
    if (pathway && userIsLoggedIn) {
      handleFetchEnrollmentStatus();
      handleFetchCompletion();
    }
  }, [pathway?.pathway_uuid]);

  const bannerImage = pathway?.metadata?.banner_image_asset_path
    ? String(pathway.metadata.banner_image_asset_path).startsWith('http')
      ? pathway.metadata.banner_image_asset_path
      : config.urls.lms() + pathway.metadata.banner_image_asset_path
    : randomImage;

  const showCta = !enrollmentStatus && !isEnrollmentSuccess && !isEnrollmentLoading;
  const ctaAction = userIsLoggedIn
    ? handleEnrollIntoPathway
    : () => handleNotLoggedInAction(tenant);

  if (loadingState === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center" data-testid="pathway-page-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (loadingState === 'failure' || !pathway) {
    return <DefaultEmptyBox message="No pathway data found." />;
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* The pathway title lives in the navbar's left cluster. */}
        <div className="h-full w-full overflow-y-auto bg-amber-50 p-6">
          {/* min-h-full so the white content container always covers the
              full height of the page, however short the content list is. */}
          <div className="grid min-h-full grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="h-full w-full bg-white p-4" data-testid="pathway-detail-content">
                <div className="pt-4">
                  <h4 className="mb-4 text-lg font-medium text-gray-800">Courses</h4>
                  {paths.length === 0 && (
                    <DefaultEmptyBox message="No courses in this pathway" className="w-full" />
                  )}
                  {paths.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 min-[450px]:grid-cols-2 lg:grid-cols-3">
                      {paths.map((course: any, index: number) => (
                        <div key={`${course.id}-${index}`} data-testid={`pathway-item-${index}`}>
                          <DiscoverContentCard
                            content={{
                              id: course?.course_id || '',
                              title: course?.name || '',
                              contentType: course?.item_type === 'course' ? 'course' : 'resource',
                              image:
                                course?.item_type === 'resource'
                                  ? course?.data?.banner_image || ''
                                  : course?.edx_data?.course_image_asset_path || '',
                              url: course?.url || '',
                            }}
                            // Resources live outside the LMS — open their URL
                            // directly instead of routing to a course page.
                            onClick={
                              course?.item_type !== 'course'
                                ? () => window.open(course?.url, '_blank')
                                : undefined
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="md:col-span-1">
              {/* top-0 (not top-6): inside the padded scroll container a
                  positive offset pins the sidebar below the content box's
                  top edge — 0 keeps both columns flush. */}
              <div className="sticky top-0 space-y-6">
                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <Image
                    src={bannerImage}
                    alt={pathway.name || ''}
                    fill
                    className="object-cover"
                    data-testid="pathway-page-banner-image"
                    onError={(e) => {
                      e.currentTarget.src = randomImage;
                    }}
                  />
                </div>

                {showCta && (
                  <button
                    onClick={ctaAction}
                    disabled={isEnrollmentSubmitting}
                    className="w-full rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] py-3 font-medium text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)] disabled:opacity-50"
                    data-testid="pathway-page-cta"
                  >
                    {isEnrollmentSubmitting ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}

                {!_.isEmpty(pathwayCompletion) && (
                  <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-800">
                        {Math.round(pathwayCompletion.completion_percentage || 0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-amber-500"
                        style={{
                          width: `${pathwayCompletion.completion_percentage || 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
