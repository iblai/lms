'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  DefaultEmptyBox,
  SkeletonMultiplier,
  SkeletonPathwayBox,
  useProfilePathways,
  getRandomCourseImage,
} from '@iblai/iblai-js/web-containers';
import {
  PathwayDetailModal,
  CreatePathwayModal,
  type CreatePathwayFormData,
  type PathwayDetailCourse,
} from '@iblai/iblai-js/web-containers/next';
import { PathwayCompletionResponse, PathwayEnrollmentPlus } from '@iblai/iblai-api';
import { getTenant, getUserId, getUserName } from '@/utils/helpers';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { config } from '@/lib/config';
// @ts-ignore
import {
  useLazyGetPathwayCompletionQuery,
  useLazyGetUserEnrolledPathwaysQuery,
  useCreateCatalogPathwaySelfEnrollmentMutation,
  useLazyGetPathwayListQuery,
  useLazyGetResourceSearchQuery,
  useCreateCatalogPathwayMutation,
} from '@iblai/iblai-js/data-layer';
import { usePersonnalizedCatalog } from '@/hooks/search/use-personnalized-catalog';
import { slugify } from '@/utils/helpers';
import { useDebouncedCallback } from 'use-debounce';

export default function PathwaysPage() {
  const { metadataLoaded, isSkillsAssignmentsFeatureHidden } = useTenantMetadata({
    org: getTenant(),
  });
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const CATALOG_TAB = 'catalog';
  const ASSIGNED_TAB = 'assigned';
  const ENROLLED_TAB = 'enrolled';
  const [activeTab, setActiveTab] = useState<'catalog' | 'assigned' | 'enrolled'>(CATALOG_TAB);
  const [selectedPathway, setSelectedPathway] = useState<PathwayEnrollmentPlus | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const {
    filteredPathways,
    isLoading,
    pathways,
    isError,
    setPathways,
    setFilteredPathways,
    pathwayCompletions,
  } = useProfilePathways({
    searchQuery,
    contentType: activeTab,
    lmsUrl: config.urls.lms(),
  });

  const [randomImage] = useState(() => getRandomCourseImage());

  const handlePathwayTabChange = (tab: 'catalog' | 'assigned' | 'enrolled') => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setSearchQuery('');
    setFilteredPathways([]);
  };

  // ----- PathwayDetailModal wiring -----
  const [getPathwayList] = useLazyGetPathwayListQuery();
  const [getPathwayCompletion] = useLazyGetPathwayCompletionQuery();
  const [getUserEnrolledPathways, { isLoading: isEnrollmentLoading }] =
    useLazyGetUserEnrolledPathwaysQuery();
  const [
    createCatalogPathwaySelfEnrollment,
    { isError: isEnrollmentError, isSuccess: isEnrollmentSuccess },
  ] = useCreateCatalogPathwaySelfEnrollmentMutation();

  const [paths, setPaths] = useState<PathwayDetailCourse[]>([]);
  const [pathwayDetailLoading, setPathwayDetailLoading] = useState(false);
  const [pathwayCompletion, setPathwayCompletion] = useState<PathwayCompletionResponse | null>(
    null,
  );
  const [enrollmentStatus, setEnrollmentStatus] = useState(false);
  const [isEnrollmentSubmitting, setIsEnrollmentSubmitting] = useState(false);

  // For pathways page we use user-related pathway list (matches old default)
  useEffect(() => {
    if (!selectedPathway) {
      setPaths([]);
      setPathwayCompletion(null);
      setEnrollmentStatus(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setPathwayDetailLoading(true);
        const resp = await getPathwayList([
          {
            pathwayUuid: selectedPathway.pathway_uuid,
            username: getUserName(),
          },
        ]);
        const list = (resp?.data as any) ?? [];
        if (Array.isArray(list) && list.length > 0) {
          const pathwayCourses: PathwayDetailCourse[] = (list[0]?.path || []).map(
            (course: any) => ({
              ...course,
              edx_data: {
                ...course?.edx_data,
                course_image_asset_path: course?.edx_data?.course_image_asset_path
                  ? config.urls.lms() + course.edx_data.course_image_asset_path
                  : getRandomCourseImage(),
              },
            }),
          );
          if (!cancelled) setPaths(pathwayCourses);
        }
      } catch {
        if (!cancelled) {
          toast.error('Error fetching pathway details');
          setPaths([]);
        }
      } finally {
        if (!cancelled) setPathwayDetailLoading(false);
      }
    })();
    (async () => {
      try {
        const resp = await getPathwayCompletion([
          {
            pathwayUuid: selectedPathway.pathway_uuid || '',
            username: getUserName(),
          },
        ]);
        if (!cancelled) setPathwayCompletion((resp.data as PathwayCompletionResponse) || null);
      } catch {
        if (!cancelled) setPathwayCompletion(null);
      }
    })();
    (async () => {
      try {
        const resp = await getUserEnrolledPathways([
          {
            username: getUserName(),
            pathwayUuid: selectedPathway.pathway_uuid || '',
          },
        ]);
        if (!cancelled) {
          setEnrollmentStatus(
            Array.isArray(resp.data) &&
              resp.data.findIndex(
                (pre: any) => pre.active && pre?.pathway_uuid === selectedPathway.pathway_uuid,
              ) !== -1,
          );
        }
      } catch {
        if (!cancelled) setEnrollmentStatus(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPathway, getPathwayList, getPathwayCompletion, getUserEnrolledPathways]);

  const handleEnrollIntoPathway = async (pathway: PathwayEnrollmentPlus) => {
    if (isEnrollmentSubmitting) return;
    try {
      setIsEnrollmentSubmitting(true);
      await createCatalogPathwaySelfEnrollment([
        {
          requestBody: {
            // @ts-ignore
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
      setTimeout(() => setIsEnrollmentSubmitting(false), 500);
    } catch {
      toast.error('Failed to enroll into pathway');
      setIsEnrollmentSubmitting(false);
    }
  };

  const handleCourseClick = (course: PathwayDetailCourse) => {
    if (course?.item_type === 'course') {
      router.push(`/courses/${course.course_id}`);
    } else if (course?.url) {
      window.open(course.url, '_blank');
    }
  };

  // ----- CreatePathwayModal wiring -----
  const [createSearchQuery, setCreateSearchQuery] = useState('');
  const [searchedCourses, setSearchedCourses] = useState<any[]>([]);
  const [searchedResources, setSearchedResources] = useState<any[]>([]);
  const [getResourceSearch, { isLoading: isResourceSearchLoading }] =
    useLazyGetResourceSearchQuery();
  const { handleSearch: handleCatalogSearch, isLoading: isCoursesLoading } =
    usePersonnalizedCatalog();
  const [createCatalogPathway, { isError: isCreateCatalogPathwayError }] =
    useCreateCatalogPathwayMutation();

  const debouncedSearch = useDebouncedCallback(async (q: string) => {
    const resourceSearch = await getResourceSearch([
      {
        platformKey: getTenant(),
        ...(q.length > 2 ? { name: q } : {}),
      },
    ]);
    const response = await handleCatalogSearch({
      username: getUserName(),
      query: q,
      limit: 10,
      content: ['courses'],
      tenant: getTenant(),
    });
    setSearchedResources(
      (resourceSearch?.data || []).map((resource: any) => ({
        ...resource,
        image: resource?.image || resource?.data?.banner_image || getRandomCourseImage(),
      })),
    );
    setSearchedCourses(
      (response?.data?.results || []).map((result: any) => ({
        ...result,
        data: {
          ...result.data,
          edx_data: {
            ...result.data.edx_data,
            course_image_asset_path: result.data.edx_data?.course_image_asset_path
              ? config.urls.lms() + result.data.edx_data.course_image_asset_path
              : getRandomCourseImage(),
          },
        },
      })),
    );
  }, 500);

  useEffect(() => {
    if (createDialogOpen) {
      debouncedSearch(createSearchQuery);
    }
  }, [createDialogOpen, createSearchQuery, debouncedSearch]);

  const handleCreatePathwaySave = async (form: CreatePathwayFormData) => {
    const newPathway = {
      name: form.name,
      path: [
        ...form.selectedCourses.map((courseId) => ({
          item_type: 'course',
          course_id: courseId,
        })),
        ...form.selectedResources.map((resourceId) => ({
          item_type: 'resource',
          id: resourceId,
        })),
      ],
      platform_key: getTenant(),
      user_id: getUserId(),
      username: getUserName(),
      visible: false,
      pathway_id: slugify(form.name),
      data: {
        description: form.description,
        subject: form.subject,
      },
    };
    try {
      const response = await createCatalogPathway([
        {
          requestBody: newPathway,
          userId: getUserId(),
          username: getUserName(),
        },
      ]);
      if (isCreateCatalogPathwayError) {
        throw new Error();
      }
      toast.success('Pathway created successfully');
      const created = response?.data as PathwayEnrollmentPlus | undefined;
      if (created) {
        setPathways([...pathways, created]);
        setFilteredPathways([...filteredPathways, created]);
      }
      setCreateDialogOpen(false);
    } catch {
      toast.error('Failed to create pathway.');
    }
  };

  const selectedPathwayBannerSrc = selectedPathway?.metadata?.banner_image_asset_path
    ? config.urls.lms() + selectedPathway.metadata.banner_image_asset_path
    : randomImage;

  return (
    <>
      <div className="p-6">
        {/* Pathways Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => handlePathwayTabChange(CATALOG_TAB)}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === CATALOG_TAB
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              My pathways
            </button>
            {metadataLoaded && !isSkillsAssignmentsFeatureHidden() && (
              <button
                onClick={() => handlePathwayTabChange(ASSIGNED_TAB)}
                className={`border-b-2 px-1 py-2 text-sm font-medium ${
                  activeTab === ASSIGNED_TAB
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Assigned pathways
              </button>
            )}
            <button
              onClick={() => handlePathwayTabChange(ENROLLED_TAB)}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === ENROLLED_TAB
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Enrolled pathways
            </button>
          </div>
        </div>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-gray-100 py-2 pr-4 pl-10 text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          {activeTab === CATALOG_TAB && (
            <button
              className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Create Pathway</span>
            </button>
          )}
        </div>

        {((!isLoading && isError) || (!isLoading && !isError && pathways.length === 0)) && (
          <DefaultEmptyBox message="No pathways found." />
        )}
        {!isLoading &&
          !isError &&
          filteredPathways.length === 0 &&
          searchQuery.length > 2 &&
          pathways.length > 0 && (
            <DefaultEmptyBox message={`No pathways found matching ${searchQuery} query.`} />
          )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {isLoading && <SkeletonMultiplier Skeleton={SkeletonPathwayBox} multiplier={4} />}
          {!isLoading &&
            !isError &&
            filteredPathways.length > 0 &&
            filteredPathways.map((pathway, index) => (
              <div
                key={index}
                data-testid="pathway-card"
                className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
                onClick={() => setSelectedPathway(pathway)}
              >
                <div className="relative h-32 w-full overflow-hidden">
                  <Image
                    src={pathway?.metadata?.banner_image_asset_path || randomImage}
                    alt={pathway?.name || ''}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 left-2 rounded bg-amber-500 px-2 py-1 text-xs text-white">
                    PATHWAY
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-800">{pathway?.name || ''}</h3>
                  {pathwayCompletions.length > 0 && pathwayCompletions[index] && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-800">
                          {pathwayCompletions[index].completion_percentage || 0}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full bg-amber-500"
                          style={{
                            width: `${pathwayCompletions[index].completion_percentage}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
      {/* Pathway Detail Modal */}
      {selectedPathway && (
        <PathwayDetailModal
          pathway={selectedPathway}
          paths={paths}
          pathwayDetailLoading={pathwayDetailLoading}
          pathwayCompletion={pathwayCompletion}
          enrollmentStatus={enrollmentStatus}
          isEnrollmentSuccess={isEnrollmentSuccess}
          isEnrollmentLoading={isEnrollmentLoading}
          isEnrollmentSubmitting={isEnrollmentSubmitting}
          bannerImageSrc={selectedPathwayBannerSrc}
          onClose={() => setSelectedPathway(null)}
          onEnroll={handleEnrollIntoPathway}
          onCourseClick={handleCourseClick}
        />
      )}

      {/* Create Pathway Dialog */}
      {createDialogOpen && (
        <CreatePathwayModal
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSearchChange={setCreateSearchQuery}
          onSave={handleCreatePathwaySave}
          searchedCourses={searchedCourses}
          searchedResources={searchedResources}
          isCoursesLoading={isCoursesLoading}
          isResourceSearchLoading={isResourceSearchLoading}
        />
      )}
    </>
  );
}
