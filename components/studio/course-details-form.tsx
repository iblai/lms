'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useGetStudioCourseSettingsQuery,
  useUpdateStudioCourseSettingsMutation,
} from '@/services/studio';
import { getYouTubeVideoId, isYouTubeVideoUrl } from '@/utils/course-creation';
import { fromDateInputValue, toDateInputValue } from '@/utils/studio';

const DATE_FIELDS = ['start_date', 'end_date', 'enrollment_start', 'enrollment_end'] as const;
const LIST_FIELDS = ['tags', 'topics'] as const;
const TEXT_FIELDS = [
  'title',
  'subtitle',
  'short_description',
  'description',
  'language',
  'duration',
  'effort',
  'subject',
  'level',
  'intro_video',
] as const;

type DateField = (typeof DATE_FIELDS)[number];
type ListField = (typeof LIST_FIELDS)[number];
type TextField = (typeof TEXT_FIELDS)[number];
type CourseDetailsValues = Record<TextField | DateField | ListField, string> & {
  self_paced: boolean;
};

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
];

// Radix Select rejects an empty-string item value.
const NO_LEVEL = '__none__';

const toValues = (formData: Record<string, any>): CourseDetailsValues => {
  const values = { self_paced: formData.self_paced === true } as CourseDetailsValues;
  TEXT_FIELDS.forEach((field) => {
    values[field] = typeof formData[field] === 'string' ? formData[field] : '';
  });
  DATE_FIELDS.forEach((field) => {
    values[field] = toDateInputValue(formData[field]);
  });
  LIST_FIELDS.forEach((field) => {
    values[field] = Array.isArray(formData[field]) ? formData[field].join(', ') : '';
  });
  return values;
};

const toList = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

/**
 * The edited fields laid over the settings they were loaded from. Fields the
 * form does not show ride along untouched, and one the author left empty keeps
 * its original `null` rather than becoming `''`.
 */
export const buildSettingsPayload = (
  formData: Record<string, any>,
  values: CourseDetailsValues,
) => {
  const payload: Record<string, any> = { ...formData, self_paced: values.self_paced };
  TEXT_FIELDS.forEach((field) => {
    const value = values[field].trim();
    payload[field] = value === '' && formData[field] == null ? formData[field] : value;
  });
  DATE_FIELDS.forEach((field) => {
    payload[field] = fromDateInputValue(values[field], formData[field]);
  });
  LIST_FIELDS.forEach((field) => {
    const list = toList(values[field]);
    payload[field] = list.length === 0 && formData[field] == null ? formData[field] : list;
  });
  if (isYouTubeVideoUrl(values.intro_video)) {
    payload.intro_video = getYouTubeVideoId(values.intro_video);
  }
  return payload;
};

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <section className="rounded-lg border border-gray-200 bg-white">
    <div className="border-b border-gray-200 px-5 py-4">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <p className="mt-0.5 text-sm text-gray-500">{description}</p>
    </div>
    <div className="grid gap-5 p-5 md:grid-cols-2">{children}</div>
  </section>
);

const Field = ({
  id,
  label,
  hint,
  wide,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  wide?: boolean;
  children: ReactNode;
}) => (
  <div className={wide ? 'space-y-2 md:col-span-2' : 'space-y-2'}>
    <Label htmlFor={id}>{label}</Label>
    {children}
    {hint && <p className="text-xs text-gray-500">{hint}</p>}
  </div>
);

/**
 * Course details: the catalog-facing metadata and schedule of one course,
 * read from and saved to Studio's course settings.
 */
export function CourseDetailsForm({ courseId }: { courseId: string }) {
  const { data, isLoading, isError } = useGetStudioCourseSettingsQuery({ courseKey: courseId });
  const [updateSettings, { isLoading: saving }] = useUpdateStudioCourseSettingsMutation();
  const formData = data?.formData;
  const initialValues = useMemo(() => (formData ? toValues(formData) : null), [formData]);
  const [values, setValues] = useState<CourseDetailsValues | null>(null);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12" data-testid="course-details-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }
  if (isError || !formData || !values || !initialValues) {
    return <DefaultEmptyBox message="We couldn't load this course's details. Please try again." />;
  }

  const setValue = <K extends keyof CourseDetailsValues>(field: K, value: CourseDetailsValues[K]) =>
    setValues((previous) => (previous ? { ...previous, [field]: value } : previous));
  const dirty = (Object.keys(values) as (keyof CourseDetailsValues)[]).some(
    (field) => values[field] !== initialValues[field],
  );
  const levelChoices = (data?.formChoices?.level ?? []).filter((choice) => choice.value);
  const languages = LANGUAGES.some((language) => language.value === values.language)
    ? LANGUAGES
    : [
        ...LANGUAGES,
        ...(values.language ? [{ value: values.language, label: values.language }] : []),
      ];

  const handleSave = async () => {
    if (!values.title.trim()) {
      toast.error('Please enter a course title.');
      return;
    }
    if (values.end_date && values.start_date && values.end_date < values.start_date) {
      toast.error('The course end date cannot be before its start date.');
      return;
    }
    try {
      await updateSettings({
        courseKey: courseId,
        settings: buildSettingsPayload(formData, values),
      }).unwrap();
      toast.success('Course details saved.');
    } catch (error) {
      console.error('Failed to save course details:', error);
      toast.error('Could not save the course details. Please try again.');
    }
  };

  const textInput = (field: TextField, props?: { placeholder?: string; maxLength?: number }) => (
    <Input
      id={`course-${field}`}
      value={values[field]}
      onChange={(event) => setValue(field, event.target.value)}
      {...props}
    />
  );
  const dateInput = (field: DateField) => (
    <Input
      id={`course-${field}`}
      type="date"
      value={values[field]}
      onChange={(event) => setValue(field, event.target.value)}
    />
  );

  return (
    <div className="space-y-6" data-testid="course-details-form">
      <Section title="Basics" description="How the course is presented in the catalog.">
        <Field
          id="course-title"
          label="Title *"
          hint="Shown in the catalog and on the course page. The name Studio lists the course under is the Course Display Name in Settings."
          wide
        >
          {textInput('title', { maxLength: 100 })}
        </Field>
        <Field id="course-subtitle" label="Subtitle" wide>
          {textInput('subtitle', { maxLength: 150 })}
        </Field>
        <Field
          id="course-short_description"
          label="Short description"
          hint="One or two sentences shown on course cards."
          wide
        >
          <Textarea
            id="course-short_description"
            rows={2}
            maxLength={300}
            value={values.short_description}
            onChange={(event) => setValue('short_description', event.target.value)}
          />
        </Field>
        <Field id="course-description" label="Description" wide>
          <Textarea
            id="course-description"
            rows={6}
            maxLength={5000}
            value={values.description}
            onChange={(event) => setValue('description', event.target.value)}
          />
        </Field>
        <Field id="course-language" label="Language">
          <Select value={values.language} onValueChange={(value) => setValue('language', value)}>
            <SelectTrigger id="course-language">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          id="course-intro_video"
          label="Intro video"
          hint="A YouTube link or video ID, shown on the course page."
        >
          {textInput('intro_video', { placeholder: 'https://youtu.be/…' })}
        </Field>
      </Section>

      <Section title="Schedule" description="When the course runs and when learners can enroll.">
        <Field id="course-start_date" label="Course start">
          {dateInput('start_date')}
        </Field>
        <Field id="course-end_date" label="Course end">
          {dateInput('end_date')}
        </Field>
        <Field id="course-enrollment_start" label="Enrollment opens">
          {dateInput('enrollment_start')}
        </Field>
        <Field id="course-enrollment_end" label="Enrollment closes">
          {dateInput('enrollment_end')}
        </Field>
        <Field id="course-duration" label="Duration">
          {textInput('duration', { placeholder: 'e.g. 6 weeks' })}
        </Field>
        <Field id="course-effort" label="Effort">
          {textInput('effort', { placeholder: 'e.g. 3 hours per week' })}
        </Field>
        <div className="flex items-center justify-between gap-4 rounded-md border border-gray-200 px-4 py-3 md:col-span-2">
          <div>
            <Label htmlFor="course-self_paced">Self-paced</Label>
            <p className="text-xs text-gray-500">
              Learners move through the course on their own schedule instead of set due dates.
            </p>
          </div>
          <Switch
            id="course-self_paced"
            checked={values.self_paced}
            onCheckedChange={(checked) => setValue('self_paced', checked)}
          />
        </div>
      </Section>

      <Section title="Catalog" description="Helps learners find the course in search and filters.">
        <Field id="course-level" label="Level">
          <Select
            value={values.level || NO_LEVEL}
            onValueChange={(value) => setValue('level', value === NO_LEVEL ? '' : value)}
          >
            <SelectTrigger id="course-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_LEVEL}>Not set</SelectItem>
              {levelChoices.map((choice) => (
                <SelectItem key={choice.value} value={choice.value}>
                  {choice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="course-subject" label="Subject">
          {textInput('subject')}
        </Field>
        <Field id="course-tags" label="Tags" hint="Separate tags with commas.">
          <Input
            id="course-tags"
            value={values.tags}
            onChange={(event) => setValue('tags', event.target.value)}
          />
        </Field>
        <Field id="course-topics" label="Topics" hint="Separate topics with commas.">
          <Input
            id="course-topics"
            value={values.topics}
            onChange={(event) => setValue('topics', event.target.value)}
          />
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-6 flex justify-end border-t border-gray-200 bg-white/95 px-6 py-3 backdrop-blur">
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={!dirty || saving}
          className="bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save changes
        </Button>
      </div>
    </div>
  );
}
