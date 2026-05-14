'use client';

import { KeyboardEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Award,
  Calendar,
  Clock,
  DollarSign,
  Globe,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  X,
} from 'lucide-react';
import _ from 'lodash';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';

import { ProgramCompletionResponse } from '@iblai/iblai-api';
import {
  // @ts-ignore
  AccessCheckResponse,
  // @ts-ignore
  useCreateCatalogProgramSelfEnrollmentMutation,
  // @ts-ignore
  useLazyCheckAccessQuery,
  // @ts-ignore
  useLazyGetProgramCompletionQuery,
  // @ts-ignore
  useLazyGetUserEnrolledProgramsQuery,
} from '@iblai/iblai-js/data-layer';
import {
  setAccessCheckResponse,
  setAdvancedDisplayMonetizationCheckoutModal,
  setDisplayMonetizationCheckoutModal,
  showMonetizationCheckoutModal,
} from '@iblai/iblai-js/web-utils';

import { DefaultEmptyBox } from '@/components/default-empty-box';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { config } from '@/lib/config';
import { usePersonnalizedCatalog } from '@/hooks/search/use-personnalized-catalog';
import { useGetProgramMetadataQuery, useUpdateProgramMetadataMutation } from '@/services/studio';
import { CustomProgramEnrollmentPlus } from '@/types/program';
import { getRandomCourseImage, getTenant, getUserName } from '@/utils/helpers';
import { useIsAdmin } from '@/utils/localstorage';
import { MONETIZATION_CLOSE_PAYLOAD } from '@/constants/global';

interface ProgramSettingsForm {
  subject: string;
  slug: string;
  tags: string[];
  level: string;
  topics: string[];
  description: string;
  display_price: string;
  start_date: string;
  end_date: string;
  enrollment_start: string;
  enrollment_end: string;
  language: string;
  credential: string;
  catalog_visibility: string;
  invitation_only: boolean;
  banner_image: string;
  card_image: string;
  promotion: string;
  social_team: string;
  social_channels: string;
}

function MultiValueInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!values.includes(inputValue.trim())) {
        onChange([...values, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="mb-2 flex flex-wrap gap-2">
        {values.map((value, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-sm text-amber-800"
          >
            {value}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="text-amber-600 hover:text-amber-800"
              aria-label={`Remove ${value}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Type and press Enter to add`}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            if (inputValue.trim() && !values.includes(inputValue.trim())) {
              onChange([...values, inputValue.trim()]);
              setInputValue('');
            }
          }}
          className="rounded-md bg-amber-500 px-3 py-2 text-white transition-colors hover:bg-amber-600"
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ImageUrlInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    setPreviewError(false);
  }, [value]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'https://example.com/image.jpg'}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
      />
      {value && (
        <div className="relative mt-2 h-32 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
          {!previewError ? (
            <Image
              src={value}
              alt={`${label} preview`}
              fill
              className="object-cover"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="text-center">
                <ImageIcon className="mx-auto mb-1 h-8 w-8" />
                <span className="text-xs">Invalid image URL</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const baseInputClasses =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent';

export default function ProgramDetailPage() {
  const router = useRouter();
  const params = useParams();
  const programId = decodeURIComponent(params.program_id as string);
  const dispatch = useDispatch();
  const isAdmin = useIsAdmin();

  const { handleSearch } = usePersonnalizedCatalog();
  const [getUserEnrolledPrograms, { isLoading: isEnrollmentLoading }] =
    useLazyGetUserEnrolledProgramsQuery();
  const [getProgramCompletion] = useLazyGetProgramCompletionQuery();
  const [
    createCatalogProgramSelfEnrollment,
    { isError: isEnrollmentError, isSuccess: isEnrollmentSuccess },
  ] = useCreateCatalogProgramSelfEnrollmentMutation();
  const [checkAccess] = useLazyCheckAccessQuery();
  const [updateProgramMetadata, { isLoading: isSavingSettings }] =
    useUpdateProgramMetadataMutation();

  const [program, setProgram] = useState<CustomProgramEnrollmentPlus | null>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'failure'>('loading');
  const [enrollmentStatus, setEnrollmentStatus] = useState<boolean>(false);
  const [programCompletion, setProgramCompletion] = useState<ProgramCompletionResponse | null>(
    null,
  );
  const [hasMonetizationAccess, setHasMonetizationAccess] = useState<boolean>(true);
  const [accessCheckData, setAccessCheckData] = useState<AccessCheckResponse | null>(null);
  const [isEnrollmentSubmitting, setIsEnrollmentSubmitting] = useState(false);
  const [randomImage] = useState(() => getRandomCourseImage());
  const [programDetail, setProgramDetail] = useState<Record<string, any> | null>(null);
  const [programDetailLoading, setProgramDetailLoading] = useState<boolean>(false);

  const [settingsForm, setSettingsForm] = useState<ProgramSettingsForm>({
    subject: '',
    slug: '',
    tags: [],
    level: '',
    topics: [],
    description: '',
    display_price: '',
    start_date: '',
    end_date: '',
    enrollment_start: '',
    enrollment_end: '',
    language: '',
    credential: '',
    catalog_visibility: 'both',
    invitation_only: false,
    banner_image: '',
    card_image: '',
    promotion: '',
    social_team: '',
    social_channels: '',
  });

  const programOrg = (program as any)?.org || (program as any)?.platform_key || getTenant();
  const showTabs = !!program && program?.platform_key === getTenant() && isAdmin;

  const {
    data: programMetadata,
    isLoading: isLoadingMetadata,
    refetch: refetchMetadata,
  } = useGetProgramMetadataQuery({ programId, org: programOrg }, { skip: !programId });

  useEffect(() => {
    if (programMetadata) {
      const metadata = programMetadata?.formData;
      setSettingsForm({
        subject: metadata.subject || '',
        slug: metadata.slug || '',
        tags: Array.isArray(metadata.tags) ? metadata.tags : [],
        level: metadata.level || '',
        topics: Array.isArray(metadata.topics) ? metadata.topics : [],
        description: metadata.description || '',
        display_price: metadata.display_price || '',
        start_date: metadata.start_date ? String(metadata.start_date).split('T')[0] : '',
        end_date: metadata.end_date ? String(metadata.end_date).split('T')[0] : '',
        enrollment_start: metadata.enrollment_start
          ? String(metadata.enrollment_start).split('T')[0]
          : '',
        enrollment_end: metadata.enrollment_end
          ? String(metadata.enrollment_end).split('T')[0]
          : '',
        language: metadata.language || '',
        credential: metadata.credential || '',
        catalog_visibility: metadata.catalog_visibility || 'both',
        invitation_only: metadata.invitation_only || false,
        banner_image: metadata.banner_image || '',
        card_image: metadata.card_image || '',
        promotion: typeof metadata.promotion === 'string' ? metadata.promotion : '',
        social_team: metadata.social_team || '',
        social_channels: Array.isArray(metadata.social_channels)
          ? metadata.social_channels.join(', ')
          : metadata.social_channels || '',
      });
    }
  }, [programMetadata]);

  const handleSettingsChange = (field: keyof ProgramSettingsForm, value: any) => {
    setSettingsForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
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

      await updateProgramMetadata({ programId, org: programOrg, settings }).unwrap();
      refetchMetadata();
      toast.success('Program settings saved successfully');
    } catch (error) {
      console.error('Error saving program settings:', error);
      toast.error('Failed to save program settings');
    }
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const dispatchPaywall = (data: AccessCheckResponse) => {
    dispatch(setDisplayMonetizationCheckoutModal(true));
    /* dispatch(
        setAdvancedDisplayMonetizationCheckoutModal({
          showModal: true,
          paywallClosable: true,
          onClosePayload: MONETIZATION_CLOSE_PAYLOAD.redirect_402,
        }),
      ); */
  };

  const handleOpenMonetizationCheckoutModal = () => {
    if (accessCheckData) {
      dispatchPaywall(accessCheckData);
    }
  };

  const handleCheckMonetizationAccess = async (programKey: string) => {
    try {
      const result = await checkAccess({
        item_type: 'program',
        item_id: programKey,
        platform_key: getTenant(),
      });
      const data = (result?.data ?? (result as any)?.error?.data) as
        | AccessCheckResponse
        | undefined;
      const accessGranted = !!data?.has_access;
      setHasMonetizationAccess(accessGranted);
      dispatch(setAccessCheckResponse(data));
      setAccessCheckData(data ?? null);
    } catch (error) {
      console.error('Error checking access:', error);
    }
  };

  const handleEnrollIntoProgram = async () => {
    if (isEnrollmentSubmitting || !program) return;
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
      setEnrollmentStatus(true);
      setTimeout(() => setIsEnrollmentSubmitting(false), 500);
    } catch (error) {
      toast.error('Failed to enroll into program');
      setIsEnrollmentSubmitting(false);
    }
  };

  const handleFetchEnrollmentStatus = async () => {
    try {
      const response = await getUserEnrolledPrograms([{ username: getUserName(), programId }]);
      setEnrollmentStatus(
        Array.isArray(response.data) &&
          response.data.findIndex((pre: any) => pre.active && pre?.program_id === programId) !== -1,
      );
    } catch {
      setEnrollmentStatus(false);
    }
  };

  const handleFetchCompletion = async (programKey: string) => {
    try {
      const response = await getProgramCompletion([{ programKey, username: getUserName() }]);
      setProgramCompletion(response.data as ProgramCompletionResponse);
    } catch {
      setProgramCompletion(null);
    }
  };

  const handleProgramDetailFetch = async (programInfo: CustomProgramEnrollmentPlus) => {
    try {
      setProgramDetailLoading(true);
      setProgramDetail(null);
      const response = await handleSearch({
        username: getUserName(),
        content: ['programs'],
        programId: programInfo.program_id,
        returnItems: true,
        tenant: (programInfo as any)?.platform || programInfo?.platform_key || getTenant(),
      });
      if (
        response?.data?.results &&
        Array.isArray(response.data.results) &&
        response.data.results.length > 0
      ) {
        const allCourses = response.data.results.reduce((acc: any[], p: any) => {
          if (p?.courses && Array.isArray(p.courses)) {
            return [...acc, ...p.courses];
          }
          return acc;
        }, []);

        const uniqueCourses = allCourses.filter(
          (course: any, index: number, self: any) =>
            index === self.findIndex((c: any) => c.course?.course_id === course.course?.course_id),
        );

        const programCourses = uniqueCourses.map((course: any) => ({
          ...course,
          course: {
            ...course?.course,
            edx_data: {
              ...course?.course?.edx_data,
              course_image_asset_path: course?.course?.edx_data?.course_image_asset_path
                ? config.urls.lms() + course?.course?.edx_data?.course_image_asset_path
                : getRandomCourseImage(),
            },
          },
        }));

        setProgramDetail({ ...programInfo, courses: programCourses });
      }
    } catch {
      toast.error('Error fetching program details');
    } finally {
      setProgramDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    const fetchProgram = async () => {
      setLoadingState('loading');
      try {
        const response = await handleSearch({
          username: getUserName(),
          content: ['programs'],
          programId,
          returnItems: true,
          tenant: getTenant(),
        });
        const result = response?.data?.results?.[0];
        if (cancelled) return;
        if (result) {
          setProgram(result as CustomProgramEnrollmentPlus);
          setLoadingState('success');
        } else {
          setLoadingState('failure');
          router.push('/error/403');
        }
      } catch {
        if (cancelled) return;
        setLoadingState('failure');
        router.push('/error/403');
      }
    };
    fetchProgram();
    return () => {
      cancelled = true;
    };
  }, [programId]);

  useEffect(() => {
    if (program) {
      handleFetchEnrollmentStatus();
      handleProgramDetailFetch(program);
      if (program.program_key) {
        handleCheckMonetizationAccess(program.program_key);
        handleFetchCompletion(program.program_key);
      }
    }
  }, [program?.program_id]);

  const cardImage = program?.program_metadata?.card_image
    ? String(program.program_metadata.card_image).startsWith('http')
      ? program.program_metadata.card_image
      : config.urls.lms() + program.program_metadata.card_image
    : randomImage;

  const showCta = !enrollmentStatus && !isEnrollmentSuccess && !isEnrollmentLoading;
  const ctaLabel = !hasMonetizationAccess
    ? 'Purchase Now'
    : isEnrollmentSubmitting
      ? 'Enrolling...'
      : 'Enroll Now';
  const ctaAction = hasMonetizationAccess
    ? handleEnrollIntoProgram
    : handleOpenMonetizationCheckoutModal;

  const metadata = program?.program_metadata as any;

  if (loadingState !== 'success' || !program) {
    return (
      <div className="flex flex-1 items-center justify-center" data-testid="program-page-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  const renderCoursesList = () =>
    programDetailLoading ? (
      <div className="flex h-full items-center justify-center py-8" data-testid="courses-loading">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" aria-label="Loading courses" />
      </div>
    ) : (
      <div className="pt-4">
        <h4 className="mb-4 text-lg font-medium text-gray-800">Courses</h4>
        <div className="space-y-4">
          {(!programDetail?.courses || programDetail?.courses?.length === 0) && (
            <DefaultEmptyBox message="No courses found under this program." className="w-full" />
          )}
          {programDetail?.courses?.length > 0 &&
            programDetail?.courses?.map((course: any, index: number) => (
              <div
                onClick={
                  hasMonetizationAccess
                    ? () => handleCourseClick(course?.course?.course_id)
                    : undefined
                }
                key={course?.course.id}
                className={`overflow-hidden rounded-lg border border-gray-200 transition-shadow ${
                  hasMonetizationAccess
                    ? 'cursor-pointer hover:shadow-md'
                    : 'cursor-not-allowed opacity-70'
                }`}
                data-testid={`course-card-${index}`}
                role={hasMonetizationAccess ? 'button' : undefined}
                tabIndex={hasMonetizationAccess ? 0 : -1}
                aria-disabled={!hasMonetizationAccess}
                onKeyDown={(e) => {
                  if (hasMonetizationAccess && (e.key === 'Enter' || e.key === ' ')) {
                    handleCourseClick(course?.course?.course_id);
                  }
                }}
              >
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <h3
                    className="text-md flex items-center gap-2 font-medium text-gray-700"
                    data-testid={`course-number-${index}`}
                  >
                    <Clock className="h-4 w-4 text-amber-500" />
                    Course {index + 1}
                  </h3>
                </div>
                <div className="flex items-center gap-4 p-4">
                  <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <Image
                      src={course?.course?.edx_data?.course_image_asset_path}
                      alt={course.course.name || ''}
                      width={96}
                      height={64}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = getRandomCourseImage();
                      }}
                    />
                  </div>
                  <div>
                    <h4
                      className="text-sm font-medium text-amber-500"
                      data-testid={`course-name-${index}`}
                    >
                      {course.course.name}
                    </h4>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );

  return (
    <div className="flex flex-1 overflow-hidden">
      <div
        className="flex-1 overflow-y-auto pb-16 md:pb-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div className="border-b border-gray-200 p-6">
          <div className="mx-auto max-w-6xl">
            <h1
              className="text-base font-semibold text-gray-600 md:text-lg"
              data-testid="program-page-name"
            >
              {program.name}
            </h1>
          </div>
        </div>

        <div className="h-[calc(100%-60px)] w-full overflow-y-auto bg-amber-50 p-6 md:h-full">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="w-full bg-white p-4" data-testid="program-detail-content">
                {showTabs ? (
                  <Tabs defaultValue="about" className="w-full" data-testid="program-tabs">
                    <TabsList className="mb-4 w-full" data-testid="program-tabs-list">
                      <TabsTrigger value="about" className="flex-1" data-testid="about-tab">
                        About
                      </TabsTrigger>
                      <TabsTrigger value="courses" className="flex-1" data-testid="courses-tab">
                        Courses
                      </TabsTrigger>
                      <TabsTrigger value="settings" className="flex-1" data-testid="settings-tab">
                        Settings
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="about" data-testid="about-tab-content">
                      <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="mb-4 text-lg font-medium text-gray-800">
                          Program Description
                        </h2>
                        {programMetadata?.formData?.description ? (
                          <p className="text-gray-600">{programMetadata.formData.description}</p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No description available.</p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="courses" data-testid="courses-tab-content">
                      {renderCoursesList()}
                    </TabsContent>

                    <TabsContent value="settings" data-testid="settings-tab-content">
                      {isLoadingMetadata ? (
                        <div
                          className="flex items-center justify-center py-8"
                          data-testid="settings-loading"
                        >
                          <Loader2
                            className="h-8 w-8 animate-spin text-amber-500"
                            aria-label="Loading settings"
                          />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <fieldset className="space-y-4" data-testid="basic-information-section">
                            <legend className="w-full border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
                              Basic Information
                            </legend>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Subject</label>
                                <input
                                  type="text"
                                  value={settingsForm.subject}
                                  onChange={(e) => handleSettingsChange('subject', e.target.value)}
                                  placeholder="e.g., Computer Science"
                                  className={baseInputClasses}
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  URL Slug
                                </label>
                                <input
                                  type="text"
                                  value={settingsForm.slug}
                                  onChange={(e) => handleSettingsChange('slug', e.target.value)}
                                  placeholder="e.g., my-program"
                                  className={baseInputClasses}
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Level</label>
                                <input
                                  type="text"
                                  value={settingsForm.level}
                                  onChange={(e) => handleSettingsChange('level', e.target.value)}
                                  placeholder="e.g., Beginner, Intermediate, Advanced"
                                  className={baseInputClasses}
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Language
                                </label>
                                <input
                                  type="text"
                                  value={settingsForm.language}
                                  onChange={(e) => handleSettingsChange('language', e.target.value)}
                                  placeholder="e.g., en"
                                  className={baseInputClasses}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                Description
                              </label>
                              <textarea
                                value={settingsForm.description}
                                onChange={(e) =>
                                  handleSettingsChange('description', e.target.value)
                                }
                                placeholder="Program description..."
                                rows={3}
                                className={baseInputClasses}
                              />
                            </div>

                            <MultiValueInput
                              label="Tags"
                              values={settingsForm.tags}
                              onChange={(values) => handleSettingsChange('tags', values)}
                              placeholder="Type a tag and press Enter"
                            />

                            <MultiValueInput
                              label="Topics"
                              values={settingsForm.topics}
                              onChange={(values) => handleSettingsChange('topics', values)}
                              placeholder="Type a topic and press Enter"
                            />
                          </fieldset>

                          <fieldset className="space-y-4" data-testid="pricing-dates-section">
                            <legend className="w-full border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
                              Pricing & Dates
                            </legend>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                Display Price
                              </label>
                              <input
                                type="text"
                                value={settingsForm.display_price}
                                onChange={(e) =>
                                  handleSettingsChange('display_price', e.target.value)
                                }
                                placeholder="e.g., $99.00"
                                className={baseInputClasses}
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  value={settingsForm.start_date}
                                  onChange={(e) =>
                                    handleSettingsChange('start_date', e.target.value)
                                  }
                                  max={settingsForm.end_date || undefined}
                                  className={baseInputClasses}
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  End Date
                                </label>
                                <input
                                  type="date"
                                  value={settingsForm.end_date}
                                  onChange={(e) => handleSettingsChange('end_date', e.target.value)}
                                  min={settingsForm.start_date || undefined}
                                  className={baseInputClasses}
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Enrollment Start
                                </label>
                                <input
                                  type="date"
                                  value={settingsForm.enrollment_start}
                                  onChange={(e) =>
                                    handleSettingsChange('enrollment_start', e.target.value)
                                  }
                                  max={settingsForm.enrollment_end || undefined}
                                  className={baseInputClasses}
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Enrollment End
                                </label>
                                <input
                                  type="date"
                                  value={settingsForm.enrollment_end}
                                  onChange={(e) =>
                                    handleSettingsChange('enrollment_end', e.target.value)
                                  }
                                  min={settingsForm.enrollment_start || undefined}
                                  className={baseInputClasses}
                                />
                              </div>
                            </div>
                          </fieldset>

                          <fieldset className="space-y-4" data-testid="visibility-access-section">
                            <legend className="w-full border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
                              Visibility & Access
                            </legend>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Catalog Visibility
                                </label>
                                <Select
                                  value={settingsForm.catalog_visibility}
                                  onValueChange={(value) =>
                                    handleSettingsChange('catalog_visibility', value)
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select visibility" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="both">Both</SelectItem>
                                    <SelectItem value="about">About</SelectItem>
                                    <SelectItem value="none">None</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Invitation Only
                                </label>
                                <div className="flex items-center gap-2 pt-2">
                                  <Switch
                                    checked={settingsForm.invitation_only}
                                    onCheckedChange={(checked) =>
                                      handleSettingsChange('invitation_only', checked)
                                    }
                                    className="data-[state=checked]:bg-amber-500"
                                  />
                                  <span className="text-sm text-gray-600">
                                    {settingsForm.invitation_only ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                Credential
                              </label>
                              <input
                                type="text"
                                value={settingsForm.credential}
                                onChange={(e) => handleSettingsChange('credential', e.target.value)}
                                placeholder="Credential information"
                                className={baseInputClasses}
                              />
                            </div>
                          </fieldset>

                          <fieldset className="space-y-4" data-testid="images-section">
                            <legend className="w-full border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
                              Images
                            </legend>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <ImageUrlInput
                                label="Banner Image URL"
                                value={settingsForm.banner_image}
                                onChange={(value) => handleSettingsChange('banner_image', value)}
                                placeholder="https://example.com/banner.jpg"
                              />

                              <ImageUrlInput
                                label="Card Image URL"
                                value={settingsForm.card_image}
                                onChange={(value) => handleSettingsChange('card_image', value)}
                                placeholder="https://example.com/card.jpg"
                              />
                            </div>
                          </fieldset>

                          <fieldset className="space-y-4" data-testid="social-promotion-section">
                            <legend className="w-full border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
                              Social & Promotion
                            </legend>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Promotion</label>
                              <input
                                type="text"
                                value={settingsForm.promotion}
                                onChange={(e) => handleSettingsChange('promotion', e.target.value)}
                                placeholder="Promotion data"
                                className={baseInputClasses}
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Social Team
                                </label>
                                <input
                                  type="text"
                                  value={settingsForm.social_team}
                                  onChange={(e) =>
                                    handleSettingsChange('social_team', e.target.value)
                                  }
                                  placeholder="Social team info"
                                  className={baseInputClasses}
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Social Channels
                                </label>
                                <input
                                  type="text"
                                  value={settingsForm.social_channels}
                                  onChange={(e) =>
                                    handleSettingsChange('social_channels', e.target.value)
                                  }
                                  placeholder="Social channels"
                                  className={baseInputClasses}
                                />
                              </div>
                            </div>
                          </fieldset>

                          <div className="border-t border-gray-200 pt-4">
                            <button
                              onClick={handleSaveSettings}
                              disabled={isSavingSettings}
                              className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-sm font-medium text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)] disabled:opacity-50"
                              data-testid="save-settings-button"
                            >
                              {isSavingSettings ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                              Save Settings
                            </button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  renderCoursesList()
                )}
              </div>
            </div>
            <div className="md:col-span-1">
              <div className="sticky top-6 space-y-6">
                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <Image
                    src={cardImage}
                    alt={program.name || ''}
                    fill
                    className="object-cover"
                    data-testid="program-page-card-image"
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
                    data-testid="program-page-cta"
                  >
                    {ctaLabel}
                  </button>
                )}

                {!_.isEmpty(programCompletion) && (
                  <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-800">
                        {programCompletion.completion_percentage || 0}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-amber-500"
                        style={{
                          width: `${programCompletion.completion_percentage || 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {(metadata?.display_price ||
                  metadata?.language ||
                  metadata?.start_date ||
                  metadata?.credential) && (
                  <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
                    {metadata?.display_price && (
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="mr-3 h-5 w-5 text-amber-500" />
                        <span>{metadata.display_price}</span>
                      </div>
                    )}
                    {metadata?.language && (
                      <div className="flex items-center text-gray-600">
                        <Globe className="mr-3 h-5 w-5 text-amber-500" />
                        <span>{metadata.language}</span>
                      </div>
                    )}
                    {metadata?.start_date && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="mr-3 h-5 w-5 text-amber-500" />
                        <span>{dayjs(metadata.start_date).format('MMM D, YYYY')}</span>
                      </div>
                    )}
                    {metadata?.credential && (
                      <div className="flex items-center text-gray-600">
                        <Award className="mr-3 h-5 w-5 text-amber-500" />
                        <span>{metadata.credential}</span>
                      </div>
                    )}
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
