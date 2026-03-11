'use client';
import Image from 'next/image';
import { X, Clock, Loader2, Plus, Save, ImageIcon } from 'lucide-react';
import { ProgramCompletionResponse } from '@iblai/iblai-api';
import { useEffect, useState, KeyboardEvent } from 'react';
import { usePersonnalizedCatalog } from '@/hooks/search/use-personnalized-catalog';
import { getRandomCourseImage, getTenant, getUserName } from '@/utils/helpers';
import { DefaultEmptyBox } from './default-empty-box';
import { config } from '@/lib/config';
import { useRouter } from 'next/navigation';
import { useIsAdmin } from '@/utils/localstorage';
import { toast } from 'sonner';
import {
  // @ts-ignore
  useLazyGetProgramCompletionQuery,
  // @ts-ignore
  useLazyGetUserEnrolledProgramsQuery,
  // @ts-ignore
  useCreateCatalogProgramSelfEnrollmentMutation,
} from '@iblai/iblai-js/data-layer';
import { useGetProgramMetadataQuery, useUpdateProgramMetadataMutation } from '@/services/studio';
import _ from 'lodash';
import { CustomProgramEnrollmentPlus } from '@/types/program';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProgramDetailModalProps {
  program: CustomProgramEnrollmentPlus;
  onClose: () => void;
}

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

// Multi-value input component for tags and topics
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
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((value, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-sm"
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
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => {
            if (inputValue.trim() && !values.includes(inputValue.trim())) {
              onChange([...values, inputValue.trim()]);
              setInputValue('');
            }
          }}
          className="px-3 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Image URL input with preview
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
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
      />
      {value && (
        <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          {!previewError ? (
            <Image
              src={value}
              alt={`${label} preview`}
              fill
              className="object-cover"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                <span className="text-xs">Invalid image URL</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProgramDetailModal({ program, onClose }: ProgramDetailModalProps) {
  const { handleSearch } = usePersonnalizedCatalog();
  const [getUserEnrolledPrograms, { isLoading: isEnrollmentLoading }] =
    useLazyGetUserEnrolledProgramsQuery();
  const [getProgramCompletion] = useLazyGetProgramCompletionQuery();
  const [
    createCatalogProgramSelfEnrollment,
    { isError: isEnrollmentError, isSuccess: isEnrollmentSuccess },
  ] = useCreateCatalogProgramSelfEnrollmentMutation();

  // Get org from program data
  const programOrg = (program as any)?.org || (program as any)?.platform_key || getTenant();
  const isAdmin = useIsAdmin();

  // Show tabs only if user is admin and program belongs to current tenant
  const showTabs = program?.platform_key === getTenant() && isAdmin;

  // Fetch program metadata using the new endpoint
  const {
    data: programMetadata,
    isLoading: isLoadingMetadata,
    refetch: refetchMetadata,
  } = useGetProgramMetadataQuery(
    { programId: program.program_id || '', org: programOrg },
    { skip: !program.program_id },
  );

  const [updateProgramMetadata, { isLoading: isSavingSettings }] =
    useUpdateProgramMetadataMutation();
  const [programDetailLoading, setProgramDetailLoading] = useState<boolean>(false);
  const [programDetail, setProgramDetail] = useState<Record<string, any> | null>(null);
  const [randomImage] = useState(() => getRandomCourseImage());
  const router = useRouter();
  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const [enrollmentStatus, setEnrollmentStatus] = useState<boolean>(false);
  const [programCompletion, setProgramCompletion] = useState<ProgramCompletionResponse | null>(
    null,
  );
  const [isEnrollmentSubmitting, setIsEnrollmentSubmitting] = useState(false);

  // Settings form state
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

  // Initialize settings form from fetched program metadata
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
    setSettingsForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = async () => {
    // Validate dates - end dates must be after start dates
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
        programId: program.program_id || '',
        org: programOrg,
        settings,
      }).unwrap();

      // Refetch metadata after successful update
      refetchMetadata();
      toast.success('Program settings saved successfully');
    } catch (error) {
      console.error('Error saving program settings:', error);
      toast.error('Failed to save program settings');
    }
  };

  const handleEnrollIntoProgram = async (program: CustomProgramEnrollmentPlus) => {
    if (isEnrollmentSubmitting) {
      return;
    }
    try {
      setIsEnrollmentSubmitting(true);
      await createCatalogProgramSelfEnrollment([
        {
          requestBody: {
            //program_id: program.program_id || "",
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
      setTimeout(() => {
        setIsEnrollmentSubmitting(false);
      }, 500);
    } catch (error) {
      toast.error('Failed to enroll into program');
      setIsEnrollmentSubmitting(false);
    }
  };

  const handleFetchProgramEnrollmentStatus = async () => {
    try {
      const response = await getUserEnrolledPrograms([
        {
          username: getUserName(),
          programId: program.program_id || '',
        },
      ]);
      setEnrollmentStatus(
        Array.isArray(response.data) &&
          response.data.findIndex((pre: any) => pre.active && pre?.program_id === program.program_id) !==
            -1,
      );
    } catch (error) {
      setEnrollmentStatus(false);
    }
  };

  const handleFetchProgramCompletion = async () => {
    try {
      const response = await getProgramCompletion([
        {
          programKey: program.program_key || '',
          username: getUserName(),
        },
      ]);
      setProgramCompletion(response.data as ProgramCompletionResponse);
    } catch (error) {
      setProgramCompletion(null);
    }
  };

  const handleProgramDetailFetch = async () => {
    try {
      setProgramDetailLoading(true);
      setProgramDetail(null);
      const response = await handleSearch({
        username: getUserName(),
        content: ['programs'],
        programId: program.program_id,
        returnItems: true,
        tenant: (program as any)?.platform || program?.platform_key || getTenant(),
      });
      if (
        response?.data?.results &&
        Array.isArray(response.data.results) &&
        response.data.results.length > 0
      ) {
        // Merge all courses from all programs into one unique array
        const allCourses = response.data.results.reduce((acc: any[], program: any) => {
          if (program?.courses && Array.isArray(program.courses)) {
            return [...acc, ...program.courses];
          }
          return acc;
        }, []);

        // Remove duplicates based on course_id
        const uniqueCourses = allCourses.filter(
          (course: any, index: number, self: any) =>
            index === self.findIndex((c: any) => c.course?.course_id === course.course?.course_id),
        );

        // Process the unique courses with proper image paths
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

        setProgramDetail({
          ...program,
          courses: programCourses,
        });
        setProgramDetailLoading(false);
      } else {
        setProgramDetailLoading(false);
      }
    } catch (error) {
      toast.error('Error fetching program details');
      setProgramDetailLoading(false);
    }
  };

  useEffect(() => {
    handleProgramDetailFetch();
    handleFetchProgramEnrollmentStatus();
    handleFetchProgramCompletion();
  }, [program]);

  const baseInputClasses =
    'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="program-detail-modal-title"
      data-testid="program-detail-modal"
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30">
          <h3 id="program-detail-modal-title" className="text-lg font-medium text-[var(--text)]">
            Program Details
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
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

          <div
            className="relative h-48 w-full overflow-hidden rounded-lg mb-6"
            data-testid="program-banner-container"
          >
            <Image
              src={
                program.program_metadata?.card_image
                  ? String(program.program_metadata?.card_image).startsWith('http')
                    ? program.program_metadata?.card_image
                    : config.urls.lms() + program.program_metadata?.card_image
                  : randomImage
              }
              alt={program?.name || ''}
              fill
              className="object-cover"
              data-testid="program-banner-image"
              onError={(e) => {
                e.currentTarget.src = randomImage;
              }}
            />
            <div
              className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded"
              data-testid="program-badge"
            >
              PROGRAM
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-2" data-testid="program-name">
            {program?.name}
          </h2>

          {!_.isEmpty(programCompletion) && (
            <div className="space-y-1 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="text-gray-800 font-medium">
                  {programCompletion.completion_percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{
                    width: `${programCompletion.completion_percentage || 0}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {showTabs ? (
            <Tabs defaultValue="courses" className="w-full" data-testid="program-tabs">
              <TabsList className="w-full mb-4" data-testid="program-tabs-list">
                <TabsTrigger value="courses" className="flex-1" data-testid="courses-tab">
                  Courses
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1" data-testid="settings-tab">
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="courses" data-testid="courses-tab-content">
                {programDetailLoading ? (
                  <div
                    className="flex justify-center items-center h-full py-8"
                    data-testid="courses-loading"
                  >
                    <Loader2
                      className="h-8 w-8 animate-spin text-amber-500"
                      aria-label="Loading courses"
                    />
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">
                      Courses in this Program
                    </h4>

                    <div className="space-y-4">
                      {(!programDetail?.courses || programDetail?.courses?.length === 0) && (
                        <DefaultEmptyBox
                          message="No courses found under this program."
                          className="w-full"
                        />
                      )}
                      {programDetail?.courses?.length > 0 &&
                        programDetail?.courses?.map((course: any, index: number) => (
                          <div
                            onClick={() => handleCourseClick(course?.course?.course_id)}
                            key={course?.course.id}
                            className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            data-testid={`course-card-${index}`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleCourseClick(course?.course?.course_id);
                              }
                            }}
                          >
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                              <h3
                                className="text-md font-medium text-gray-700 flex items-center gap-2"
                                data-testid={`course-number-${index}`}
                              >
                                <Clock className="h-4 w-4 text-amber-500" />
                                Course {index + 1}
                              </h3>
                            </div>
                            <div className="p-4 flex items-center gap-4">
                              <div className="w-24 h-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
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
                                  className="text-amber-500 font-medium text-sm"
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
                )}
              </TabsContent>

              <TabsContent value="settings" data-testid="settings-tab-content">
                {isLoadingMetadata ? (
                  <div
                    className="flex justify-center items-center py-8"
                    data-testid="settings-loading"
                  >
                    <Loader2
                      className="h-8 w-8 animate-spin text-amber-500"
                      aria-label="Loading settings"
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <fieldset className="space-y-4" data-testid="basic-information-section">
                      <legend className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2 w-full">
                        Basic Information
                      </legend>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <label className="text-sm font-medium text-gray-700">URL Slug</label>
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
                          <label className="text-sm font-medium text-gray-700">Language</label>
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
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          value={settingsForm.description}
                          onChange={(e) => handleSettingsChange('description', e.target.value)}
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

                    {/* Pricing & Dates */}
                    <fieldset className="space-y-4" data-testid="pricing-dates-section">
                      <legend className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2 w-full">
                        Pricing & Dates
                      </legend>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Display Price</label>
                        <input
                          type="text"
                          value={settingsForm.display_price}
                          onChange={(e) => handleSettingsChange('display_price', e.target.value)}
                          placeholder="e.g., $99.00"
                          className={baseInputClasses}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Start Date</label>
                          <input
                            type="date"
                            value={settingsForm.start_date}
                            onChange={(e) => handleSettingsChange('start_date', e.target.value)}
                            max={settingsForm.end_date || undefined}
                            className={baseInputClasses}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">End Date</label>
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
                            onChange={(e) => handleSettingsChange('enrollment_end', e.target.value)}
                            min={settingsForm.enrollment_start || undefined}
                            className={baseInputClasses}
                          />
                        </div>
                      </div>
                    </fieldset>

                    {/* Visibility & Access */}
                    <fieldset className="space-y-4" data-testid="visibility-access-section">
                      <legend className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2 w-full">
                        Visibility & Access
                      </legend>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <label className="text-sm font-medium text-gray-700">Credential</label>
                        <input
                          type="text"
                          value={settingsForm.credential}
                          onChange={(e) => handleSettingsChange('credential', e.target.value)}
                          placeholder="Credential information"
                          className={baseInputClasses}
                        />
                      </div>
                    </fieldset>

                    {/* Images */}
                    <fieldset className="space-y-4" data-testid="images-section">
                      <legend className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2 w-full">
                        Images
                      </legend>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {/* Social & Promotion */}
                    <fieldset className="space-y-4" data-testid="social-promotion-section">
                      <legend className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2 w-full">
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Social Team</label>
                          <input
                            type="text"
                            value={settingsForm.social_team}
                            onChange={(e) => handleSettingsChange('social_team', e.target.value)}
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

                    {/* Save Button */}
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] rounded-md text-sm font-medium hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity disabled:opacity-50"
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
            // Non-admin view: show courses without tabs
            <>
              {programDetailLoading ? (
                <div
                  className="flex justify-center items-center h-full py-8"
                  data-testid="courses-loading"
                >
                  <Loader2
                    className="h-8 w-8 animate-spin text-amber-500"
                    aria-label="Loading courses"
                  />
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">
                    Courses in this Program
                  </h4>

                  <div className="space-y-4">
                    {(!programDetail?.courses || programDetail?.courses?.length === 0) && (
                      <DefaultEmptyBox
                        message="No courses found under this program."
                        className="w-full"
                      />
                    )}
                    {programDetail?.courses?.length > 0 &&
                      programDetail?.courses?.map((course: any, index: number) => (
                        <div
                          onClick={() => handleCourseClick(course?.course?.course_id)}
                          key={course?.course.id}
                          className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                          data-testid={`course-card-${index}`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleCourseClick(course?.course?.course_id);
                            }
                          }}
                        >
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h3
                              className="text-md font-medium text-gray-700 flex items-center gap-2"
                              data-testid={`course-number-${index}`}
                            >
                              <Clock className="h-4 w-4 text-amber-500" />
                              Course {index + 1}
                            </h3>
                          </div>
                          <div className="p-4 flex items-center gap-4">
                            <div className="w-24 h-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
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
                                className="text-amber-500 font-medium text-sm"
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
              )}
            </>
          )}
        </div>

        <div
          className={`p-4 border-t border-gray-200 bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 flex ${
            !enrollmentStatus && !isEnrollmentSuccess && !isEnrollmentLoading
              ? 'justify-between'
              : 'justify-end'
          }`}
          data-testid="program-modal-footer"
        >
          {!enrollmentStatus && !isEnrollmentSuccess && !isEnrollmentLoading && (
            <button
              onClick={() => handleEnrollIntoProgram(program)}
              disabled={isEnrollmentSubmitting}
              className="px-4 py-2 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600 transition-colors"
              data-testid="enroll-button"
            >
              {isEnrollmentSubmitting ? 'Enrolling...' : 'Enroll Now'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            data-testid="close-button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
