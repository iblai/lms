'use client';

import { useState } from 'react';
import { toast } from 'sonner';
// @ts-ignore
import {
  useCreateStudioCourseMutation,
  useDeleteStudioCourseMutation,
  useUpdateStudioCourseSettingsMutation,
} from '@iblai/iblai-js/data-layer';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { getOrg } from '@/utils/helpers';
import { parseCourseKey } from '@/utils/course-creation';

export interface CourseCreationFields {
  display_name: string;
  description: string;
}

const DEFAULT_FIELDS: CourseCreationFields = {
  display_name: '',
  description: '',
};

/**
 * Minimal course-creation flow against Studio: create the course shell, then
 * apply its basic settings (name + description). Settings failure rolls the
 * shell back so no partial course is left behind. On success the created
 * course key is exposed so the UI can hand off to Studio for authoring.
 */
export function useCourseCreation() {
  const tenant = useTenantParam();

  const [fields, setFields] = useState<CourseCreationFields>(DEFAULT_FIELDS);
  const [submitting, setSubmitting] = useState(false);
  const [createdCourseKey, setCreatedCourseKey] = useState<string | null>(null);

  const [createCourse] = useCreateStudioCourseMutation();
  const [deleteCourse] = useDeleteStudioCourseMutation();
  const [updateCourseSettings] = useUpdateStudioCourseSettingsMutation();

  const setField = <K extends keyof CourseCreationFields>(
    name: K,
    value: CourseCreationFields[K],
  ) => {
    setFields((previous) => ({ ...previous, [name]: value }));
  };

  /**
   * Mirrors the legacy analytics-SPA course settings payload: identity fields
   * plus the edX defaults Studio expects on a fresh course.
   */
  const buildSettingsPayload = (org: string, courseKey: string) => {
    const { courseID, courseRun } = parseCourseKey(courseKey);
    return {
      org,
      course_id: courseID,
      run: courseRun,
      course_key: courseKey,
      platform_key: tenant,
      display_name: fields.display_name,
      title: fields.display_name,
      description: fields.description,
      duration: '',
      language: 'en',
      start_date: new Date().toISOString(),
      enrollment_start: new Date().toISOString(),
      tags: [],
      topics: [],
      // edX defaults expected by the course_settings endpoint
      certificates_display_behavior: 'end',
      certificate_available_date: null,
      entrance_exam_enabled: '',
      entrance_exam_id: '',
      entrance_exam_minimum_score_pct: '50',
      enrollment_end: null,
      end_date: null,
      self_paced: true,
      learning_info: [],
      instructor_info: { instructors: [] },
    };
  };

  const handleFormSubmit = async () => {
    if (submitting) return;

    if (!fields.display_name.trim() || !fields.description.trim()) {
      toast.error('Please fill in the course name and description.');
      return;
    }

    const org = getOrg();
    if (!org) {
      toast.error('Could not determine your organization. Please re-select your tenant.');
      return;
    }

    setSubmitting(true);
    let courseKey = '';
    try {
      // 1. Create the course shell.
      const created = await createCourse({
        courseData: { org, display_name: fields.display_name },
      }).unwrap();
      courseKey = created?.course_key ?? '';
      if (!courseKey) {
        throw new Error('Course creation failed: Studio did not return a course key.');
      }

      // 2. Apply the basic course settings.
      await updateCourseSettings({
        settings: buildSettingsPayload(org, courseKey),
      }).unwrap();

      toast.success('Course created successfully.');
      setCreatedCourseKey(courseKey);
    } catch (error) {
      // Roll back the partially created course so nothing incomplete is left.
      if (courseKey) {
        try {
          await deleteCourse({ courseKey }).unwrap();
        } catch {
          // Rollback is best-effort — surface the original error below.
        }
      }
      const message =
        error instanceof Error
          ? error.message
          : (error as { data?: unknown })?.data && typeof (error as any).data === 'string'
            ? (error as any).data
            : 'Course creation failed. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    fields,
    setField,
    submitting,
    createdCourseKey,
    handleFormSubmit,
  };
}
