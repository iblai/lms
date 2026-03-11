'use client';
import Image from 'next/image';
import { X, Clock, Loader2 } from 'lucide-react';
import { PathwayCompletionResponse, PathwayEnrollmentPlus } from '@iblai/iblai-api';
import { getRandomCourseImage, getUserName } from '@/utils/helpers';
import { config } from '@/lib/config';
import { useEffect, useState } from 'react';
import { DefaultEmptyBox } from './default-empty-box';
import { useRouter } from 'next/navigation';
// @ts-ignore
import {
  useLazyGetPathwayCompletionQuery,
  useLazyGetUserEnrolledPathwaysQuery,
  useCreateCatalogPathwaySelfEnrollmentMutation,
  useLazyGetPathwayListQuery,
} from '@iblai/iblai-js/data-layer';
import _ from 'lodash';
import { toast } from 'sonner';
import { usePersonnalizedCatalog } from '@/hooks/search/use-personnalized-catalog';
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
  const { handleSearch } = usePersonnalizedCatalog();
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
      router.push(`/courses/${course.course_id}`);
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
            // @ts-expect-error pathway_uuid may not be part of the requestBody type
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
            (pre) => pre.active && pre?.pathway_uuid === pathway.pathway_uuid,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30">
          <h3 className="text-lg font-medium text-[var(--text)]">Pathway Details</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-[var(--primary-light)] hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="p-6 max-h-[70vh] overflow-y-auto"
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

          <div className="relative h-48 w-full overflow-hidden rounded-lg mb-6">
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
            <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
              PATHWAY
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">{pathway.name}</h2>
          {!_.isEmpty(pathwayCompletion) && (
            <div className="space-y-1 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="text-gray-800 font-medium">
                  {pathwayCompletion.completion_percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{
                    width: `${pathwayCompletion.completion_percentage || 0}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Content in this Pathway</h4>
            {pathwayDetailLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : paths.length > 0 ? (
              <div className="space-y-4">
                {paths.map((course, index) => (
                  <div
                    onClick={() => handleCourseClick(course)}
                    key={`${course.id}-${index}`}
                    className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-md font-medium text-gray-700 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        {course?.item_type === 'course' ? 'Course' : 'Resource'}
                      </h3>
                    </div>
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-24 h-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
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
                        <h4 className="text-amber-500 font-medium text-sm">{course.name}</h4>
                        {course?.data?.edx_data && (
                          <>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{course.data.edx_data.duration}</span>
                            </div>
                            <div className="mt-1">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
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
          className={`p-4 border-t border-gray-200 bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 flex ${
            !enrollmentStatus && !isEnrollmentSuccess && !isEnrollmentLoading
              ? 'justify-between'
              : 'justify-end'
          }`}
        >
          {!enrollmentStatus && !isEnrollmentSuccess && !isEnrollmentLoading && (
            <button
              onClick={() => handleEnrollIntoPathway(pathway)}
              disabled={isEnrollmentSubmitting}
              className="px-4 py-2 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              {isEnrollmentSubmitting ? 'Enrolling...' : 'Enroll Now'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
