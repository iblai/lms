'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  DefaultEmptyBox,
  SkeletonMultiplier,
  SkeletonPathwayBox,
  useProfilePrograms,
  getRandomCourseImage,
} from '@iblai/iblai-js/web-containers';
import {
  ProgramDetailModal,
  type ProgramSettingsFormData,
  type ProgramDetailCourse,
} from '@iblai/iblai-js/web-containers/next';
import { ProgramCompletionResponse } from '@iblai/iblai-api';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { getTenant, getUserName } from '@/utils/helpers';
import { useIsAdmin } from '@/utils/localstorage';
import { CustomProgramEnrollmentPlus } from '@/types/program';
import { config } from '@/lib/config';
// @ts-ignore
import {
  useLazyGetProgramCompletionQuery,
  useLazyGetUserEnrolledProgramsQuery,
  useCreateCatalogProgramSelfEnrollmentMutation,
} from '@iblai/iblai-js/data-layer';
import { useGetProgramMetadataQuery, useUpdateProgramMetadataMutation } from '@/services/studio';
import { usePersonnalizedCatalog } from '@/hooks/search/use-personnalized-catalog';

export default function ProgramsPage() {
  const { metadataLoaded, isSkillsAssignmentsFeatureHidden } = useTenantMetadata({
    org: getTenant(),
  });
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const ENROLLED_TAB = 'enrolled';
  const ASSIGNED_TAB = 'assigned';
  const [activeTab, setActiveTab] = useState<'enrolled' | 'assigned' | 'catalog'>(ENROLLED_TAB);
  const [selectedProgram, setSelectedProgram] = useState<CustomProgramEnrollmentPlus | null>(null);
  const [randomImage] = useState(() => getRandomCourseImage());
  const {
    programs,
    filteredPrograms,
    isLoading,
    isError,
    setFilteredPrograms,
    setPrograms,
    programCompletions,
  } = useProfilePrograms({
    searchQuery,
    activeTab,
  });

  const handleProgramTabChange = (tab: 'enrolled' | 'assigned' | 'catalog') => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setSearchQuery('');
    setFilteredPrograms([]);
    setPrograms([]);
  };

  // ----- ProgramDetailModal wiring -----
  const { handleSearch } = usePersonnalizedCatalog();
  const [getUserEnrolledPrograms, { isLoading: isEnrollmentLoading }] =
    useLazyGetUserEnrolledProgramsQuery();
  const [getProgramCompletion] = useLazyGetProgramCompletionQuery();
  const [
    createCatalogProgramSelfEnrollment,
    { isError: isEnrollmentError, isSuccess: isEnrollmentSuccess },
  ] = useCreateCatalogProgramSelfEnrollmentMutation();

  const programOrg =
    (selectedProgram as any)?.org || (selectedProgram as any)?.platform_key || getTenant();

  const showSettings = !!isAdmin && selectedProgram?.platform_key === getTenant();

  const {
    data: programMetadata,
    isLoading: isLoadingMetadata,
    refetch: refetchMetadata,
  } = useGetProgramMetadataQuery(
    { programId: selectedProgram?.program_id || '', org: programOrg },
    { skip: !selectedProgram?.program_id || !showSettings },
  );

  const [updateProgramMetadata, { isLoading: isSavingSettings }] =
    useUpdateProgramMetadataMutation();

  const [programCourses, setProgramCourses] = useState<ProgramDetailCourse[]>([]);
  const [programDetailLoading, setProgramDetailLoading] = useState(false);
  const [programCompletion, setProgramCompletion] = useState<ProgramCompletionResponse | null>(
    null,
  );
  const [enrollmentStatus, setEnrollmentStatus] = useState(false);
  const [isEnrollmentSubmitting, setIsEnrollmentSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedProgram) {
      setProgramCourses([]);
      setProgramCompletion(null);
      setEnrollmentStatus(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setProgramDetailLoading(true);
        const response = await handleSearch({
          username: getUserName(),
          content: ['programs'],
          programId: selectedProgram.program_id,
          returnItems: true,
          tenant:
            (selectedProgram as any)?.platform || selectedProgram?.platform_key || getTenant(),
        });
        const results: any[] = response?.data?.results || [];
        const allCourses = results.reduce((acc: any[], program: any) => {
          if (program?.courses && Array.isArray(program.courses)) {
            return [...acc, ...program.courses];
          }
          return acc;
        }, []);
        const uniqueCourses = allCourses.filter(
          (course: any, index: number, self: any) =>
            index === self.findIndex((c: any) => c.course?.course_id === course.course?.course_id),
        );
        const mapped: ProgramDetailCourse[] = uniqueCourses.map((course: any) => ({
          ...course,
          course: {
            ...course?.course,
            edx_data: {
              ...course?.course?.edx_data,
              course_image_asset_path: course?.course?.edx_data?.course_image_asset_path
                ? config.urls.lms() + course.course.edx_data.course_image_asset_path
                : getRandomCourseImage(),
            },
          },
        }));
        if (!cancelled) setProgramCourses(mapped);
      } catch {
        if (!cancelled) {
          toast.error('Error fetching program details');
          setProgramCourses([]);
        }
      } finally {
        if (!cancelled) setProgramDetailLoading(false);
      }
    })();
    (async () => {
      try {
        const resp = await getUserEnrolledPrograms([
          {
            username: getUserName(),
            programId: selectedProgram.program_id || '',
          },
        ]);
        if (!cancelled) {
          setEnrollmentStatus(
            Array.isArray(resp.data) &&
              resp.data.findIndex(
                (pre: any) => pre.active && pre?.program_id === selectedProgram.program_id,
              ) !== -1,
          );
        }
      } catch {
        if (!cancelled) setEnrollmentStatus(false);
      }
    })();
    (async () => {
      try {
        const resp = await getProgramCompletion([
          {
            programKey: selectedProgram.program_key || '',
            username: getUserName(),
          },
        ]);
        if (!cancelled) setProgramCompletion((resp.data as ProgramCompletionResponse) || null);
      } catch {
        if (!cancelled) setProgramCompletion(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProgram, handleSearch, getProgramCompletion, getUserEnrolledPrograms]);

  const handleEnrollIntoProgram = async (program: any) => {
    if (isEnrollmentSubmitting) return;
    try {
      setIsEnrollmentSubmitting(true);
      await createCatalogProgramSelfEnrollment([
        {
          requestBody: {
            program_key: program.program_key || '',
            username: getUserName(),
            active: true,
            ended: null,
          },
        },
      ]);
      if (isEnrollmentError) {
        throw new Error('Failed to enroll into program');
      }
      toast.success('Enrolled into program successfully');
      setTimeout(() => setIsEnrollmentSubmitting(false), 500);
    } catch {
      toast.error('Failed to enroll into program');
      setIsEnrollmentSubmitting(false);
    }
  };

  const handleSaveSettings = async (settingsForm: ProgramSettingsFormData) => {
    if (settingsForm.start_date && settingsForm.end_date) {
      if (new Date(settingsForm.end_date) < new Date(settingsForm.start_date)) {
        toast.error('End date must be after start date');
        return;
      }
    }
    if (settingsForm.enrollment_start && settingsForm.enrollment_end) {
      if (new Date(settingsForm.enrollment_end) < new Date(settingsForm.enrollment_start)) {
        toast.error('Enrollment end date must be after enrollment start date');
        return;
      }
    }
    try {
      const settings = {
        slug: settingsForm.slug || null,
        subject: settingsForm.subject || null,
        tags: settingsForm.tags.length > 0 ? settingsForm.tags : null,
        level: settingsForm.level || null,
        topics: settingsForm.topics.length > 0 ? settingsForm.topics : null,
        promotion: settingsForm.promotion || null,
        social_team: settingsForm.social_team || null,
        social_channels: settingsForm.social_channels || null,
        description: settingsForm.description || null,
        display_price: settingsForm.display_price || null,
        start_date: settingsForm.start_date || null,
        end_date: settingsForm.end_date || null,
        enrollment_start: settingsForm.enrollment_start || null,
        enrollment_end: settingsForm.enrollment_end || null,
        language: settingsForm.language || null,
        credential: settingsForm.credential || null,
        catalog_visibility: settingsForm.catalog_visibility || null,
        invitation_only: settingsForm.invitation_only,
        banner_image: settingsForm.banner_image || null,
        card_image: settingsForm.card_image || null,
        platform_key: programOrg,
      };
      await updateProgramMetadata({
        programId: selectedProgram?.program_id || '',
        org: programOrg,
        settings,
      }).unwrap();
      refetchMetadata();
      toast.success('Program settings saved successfully');
    } catch (error) {
      console.error('Error saving program settings:', error);
      toast.error('Failed to save program settings');
    }
  };

  const selectedProgramBannerSrc = selectedProgram?.program_metadata?.card_image
    ? String(selectedProgram.program_metadata.card_image).startsWith('http')
      ? (selectedProgram.program_metadata.card_image as string)
      : config.urls.lms() + selectedProgram.program_metadata.card_image
    : randomImage;

  return (
    <>
      <div className="p-6">
        {/* Programs Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => handleProgramTabChange(ENROLLED_TAB)}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === ENROLLED_TAB
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              My programs
            </button>
            {metadataLoaded && !isSkillsAssignmentsFeatureHidden() && (
              <button
                onClick={() => handleProgramTabChange(ASSIGNED_TAB)}
                className={`border-b-2 px-1 py-2 text-sm font-medium ${
                  activeTab === ASSIGNED_TAB
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Assigned programs
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="relative w-64">
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
        </div>
        {((!isLoading && isError) || (!isLoading && !isError && programs.length === 0)) && (
          <DefaultEmptyBox message="No programs found." />
        )}
        {!isLoading &&
          !isError &&
          programs.length > 0 &&
          filteredPrograms.length === 0 &&
          searchQuery.length > 2 && (
            <DefaultEmptyBox message={`No programs found matching "${searchQuery}" query.`} />
          )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {isLoading && <SkeletonMultiplier Skeleton={SkeletonPathwayBox} multiplier={4} />}
          {!isLoading &&
            !isError &&
            filteredPrograms.length > 0 &&
            filteredPrograms.map((program: any, index: number) => (
              <div
                key={index}
                className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
                onClick={() => setSelectedProgram(program)}
                data-testid={'program-card'}
              >
                <div className="relative h-32 w-full overflow-hidden">
                  <Image
                    src={
                      program.program_metadata?.card_image
                        ? String(program.program_metadata?.card_image).startsWith('http')
                          ? program.program_metadata?.card_image
                          : config.urls.lms() + program.program_metadata?.card_image
                        : randomImage
                    }
                    alt={program.name || ''}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = randomImage;
                    }}
                  />
                  <div
                    className="absolute bottom-2 left-2 rounded bg-amber-500 px-2 py-1 text-xs text-white"
                    data-testid="program-badge"
                  >
                    PROGRAM
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-800">{program.name || ''}</h3>
                  {programCompletions.length > 0 && programCompletions[index] && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-800">
                          {programCompletions[index].completion_percentage || 0}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full bg-amber-500"
                          style={{
                            width: `${programCompletions[index].completion_percentage}%`,
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
      {selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram as any}
          courses={programCourses}
          courseListLoading={programDetailLoading}
          programCompletion={programCompletion}
          enrollmentStatus={enrollmentStatus}
          isEnrollmentLoading={isEnrollmentLoading}
          isEnrollmentSuccess={isEnrollmentSuccess}
          isEnrollmentSubmitting={isEnrollmentSubmitting}
          showSettings={showSettings}
          settingsLoading={isLoadingMetadata}
          isSavingSettings={isSavingSettings}
          initialSettings={(programMetadata as any)?.formData}
          bannerImageSrc={selectedProgramBannerSrc}
          onClose={() => setSelectedProgram(null)}
          onEnroll={handleEnrollIntoProgram}
          onCourseClick={(courseId) => router.push(`/courses/${courseId}`)}
          onSaveSettings={handleSaveSettings}
        />
      )}
    </>
  );
}
