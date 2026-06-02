'use client';
import Image from 'next/image';
import { X, Clock, Loader2 } from 'lucide-react';
import { PathwayCompletionResponse, PathwayEnrollmentPlus } from '@iblai/iblai-api';
import { getRandomCourseImage, getUserName } from '@/utils/helpers';
import { config } from '@/lib/config';
import { useEffect, useState } from 'react';
import { DefaultEmptyBox } from './default-empty-box';
import { useRouter } from 'next/navigation';
import { useTenantParam } from '@/hooks/use-tenant-param';
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
import _ from 'lodash';
import { toast } from 'sonner';
import { usePersonnalizedCatalog } from '@/hooks/search/use-personnalized-catalog';
import { isLoggedIn } from '@iblai/iblai-js/web-utils';
interface PathwayDetailModalProps {
  pathway: PathwayEnrollmentPlus;
  onClose: () => void;
  userRelatedPathway?: boolean;
}

export function PathwayDetailModal({
  pathway,
  onClose,
  userRelatedPathway = true,
}: PathwayDetailModalProps) {
  const [randomImage] = useState(() => getRandomCourseImage());
  const [paths, setPaths] = useState<any[]>([]);
  const router = useRouter();
  const tenant = useTenantParam();
  const userLoggedIn = isLoggedIn();
  const { handleSearch } = usePersonnalizedCatalog({ isLoggedIn: userLoggedIn });
  const [getUserEnrolledPathways, { isLoading: isEnrollmentLoading }] =
    useLazyGetUserEnrolledPathwaysQuery();
  const [
    createCatalogPathwaySelfEnrollment,
    { isError: isEnrollmentError, isSuccess: isEnrollmentSuccess },
  ] = useCreateCatalogPathwaySelfEnrollmentMutation();
  const [isEnrollmentSubmitting, setIsEnrollmentSubmitting] = useState(false);
  const [getPathwayCompletion] = useLazyGetPathwayCompletionQuery();
  const [getPathwayList] = useLazyGetPathwayListQuery();
  const handleCourseClick = (course: any) => {
    if (course?.item_type === 'course') {
      router.push(`/platform/${tenant}/courses/${course.course_id}`);
    } else {
      window.open(course?.url, '_blank');
    }
  };

  const [enrollmentStatus, setEnrollmentStatus] = useState<boolean>(false);
  const [pathwayCompletion, setPathwayCompletion] = useState<PathwayCompletionResponse | null>(
    null,
  );
  const [pathwayDetailLoading, setPathwayDetailLoading] = useState<boolean>(false);

  const handleEnrollIntoPathway = async (pathway: PathwayEnrollmentPlus) => {
    if (isEnrollmentSubmitting) {
      return;
    }
    try {
      setIsEnrollmentSubmitting(true);
      await createCatalogPathwaySelfEnrollment([
        {
          requestBody: {
            //@ts-ignore
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
      setTimeout(() => {
        setIsEnrollmentSubmitting(false);
      }, 500);
    } catch (error) {
      toast.error('Failed to enroll into pathway');
      setIsEnrollmentSubmitting(false);
    }
  };

  const handleFetchPathwayCompletion = async () => {
    try {
      const response = await getPathwayCompletion([
        {
          pathwayUuid: pathway.pathway_uuid || '',
          username: getUserName(),
        },
      ]);
      setPathwayCompletion(response.data as PathwayCompletionResponse);
    } catch (error) {
      setPathwayCompletion(null);
    }
  };

  const handleFetchPathwayEnrollmentStatus = async () => {
    try {
      const response = await getUserEnrolledPathways([
        {
          username: getUserName(),
          pathwayUuid: pathway.pathway_uuid || '',
        },
      ]);
      setEnrollmentStatus(
        Array.isArray(response.data) &&
          response.data.findIndex(
            (pre: any) => pre.active && pre?.pathway_uuid === pathway.pathway_uuid,
          ) !== -1,
      );
    } catch (error) {
      setEnrollmentStatus(false);
    }
  };

  const handlePathwayDetailFetch = async () => {
    try {
      setPathwayDetailLoading(true);
      const response = !userRelatedPathway
        ? await handleSearch({
            username: getUserName(),
            content: ['pathways'],
            pathwayId: pathway.pathway_uuid,
            returnItems: true,
            returnFacet: false,
            limit: 50,
          })
        : await getPathwayList([
            {
              pathwayUuid: pathway.pathway_uuid,
              username: getUserName(),
            },
          ]);

      const pathways = userRelatedPathway ? response?.data : (response?.data as any)?.results;
      if (pathways && Array.isArray(pathways) && pathways.length > 0) {
        const pathwayCourses = pathways[0]?.path?.map((course: any) => ({
          ...course,
          edx_data: {
            ...course?.edx_data,
            course_image_asset_path: course?.edx_data?.course_image_asset_path
              ? config.urls.lms() + course?.edx_data?.course_image_asset_path
              : getRandomCourseImage(),
          },
        }));
        setPaths(pathwayCourses);
        setPathwayDetailLoading(false);
      }
    } catch (error) {
      toast.error('Error fetching program details');
      setPaths([]);
      setPathwayDetailLoading(false);
    }
  };

  useEffect(() => {
    handlePathwayDetailFetch();
    handleFetchPathwayCompletion();
    handleFetchPathwayEnrollmentStatus();
  }, [pathway]);
  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 p-4">
          <h3 className="text-lg font-medium text-[var(--text)]">Pathway Details</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-[var(--primary-light)] hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="max-h-[70vh] overflow-y-auto p-6"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <div className="relative mb-6 h-48 w-full overflow-hidden rounded-lg">
            <Image
              src={
                pathway?.metadata?.banner_image_asset_path
                  ? config.urls.lms() + pathway?.metadata?.banner_image_asset_path
                  : randomImage
              }
              alt={pathway.name || ''}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = randomImage;
              }}
              priority
            />
            <div className="absolute bottom-2 left-2 rounded bg-amber-500 px-2 py-1 text-xs text-white">
              PATHWAY
            </div>
          </div>

          <h2 className="mb-2 text-xl font-semibold text-gray-800">{pathway.name}</h2>
          {!_.isEmpty(pathwayCompletion) && (
            <div className="mb-6 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-800">
                  {pathwayCompletion.completion_percentage || 0}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-amber-500"
                  style={{
                    width: `${pathwayCompletion.completion_percentage || 0}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <h4 className="mb-4 text-sm font-medium text-gray-700">Content in this Pathway</h4>
            {pathwayDetailLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : paths.length > 0 ? (
              <div className="space-y-4">
                {paths.map((course, index) => (
                  <div
                    onClick={() => handleCourseClick(course)}
                    key={`${course.id}-${index}`}
                    className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
                  >
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                      <h3 className="text-md flex items-center gap-2 font-medium text-gray-700">
                        <Clock className="h-4 w-4 text-amber-500" />
                        {course?.item_type === 'course' ? 'Course' : 'Resource'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 p-4">
                      <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <Image
                          src={
                            course?.item_type === 'resource'
                              ? course?.data?.banner_image
                              : course.edx_data.course_image_asset_path
                          }
                          alt={course.name}
                          width={96}
                          height={64}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = getRandomCourseImage();
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-amber-500">{course.name}</h4>
                        {course?.data?.edx_data && (
                          <>
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                              <Clock className="mr-1 h-3 w-3" />
                              <span>{course.data.edx_data.duration}</span>
                            </div>
                            <div className="mt-1">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                  course.completed
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {course.completed ? 'Completed' : 'In Progress'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DefaultEmptyBox className="w-full" message="No courses in this pathway" />
            )}
          </div>
        </div>

        <div
          className={`flex border-t border-gray-200 bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 p-4 ${
            !enrollmentStatus && !isEnrollmentSuccess && !isEnrollmentLoading
              ? 'justify-between'
              : 'justify-end'
          }`}
        >
          {!enrollmentStatus && !isEnrollmentSuccess && !isEnrollmentLoading && (
            <button
              onClick={() => handleEnrollIntoPathway(pathway)}
              disabled={isEnrollmentSubmitting}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
            >
              {isEnrollmentSubmitting ? 'Enrolling...' : 'Enroll Now'}
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
