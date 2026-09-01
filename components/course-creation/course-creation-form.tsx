'use client';

import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { config } from '@/lib/config';
import { useCourseCreation } from '@/hooks/course-creation/use-course-creation';

interface CourseCreationFormProps {
  onCancel?: () => void;
}

export function CourseCreationForm({ onCancel }: CourseCreationFormProps) {
  const { fields, setField, submitting, createdCourseKey, handleFormSubmit } = useCourseCreation();

  // Post-creation hand-off: authoring continues on Studio in a new tab (same
  // URL scheme as the course-content "Authoring" tab).
  if (createdCourseKey) {
    return (
      <div className="flex w-full flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-amber-500" />
        <p className="font-medium text-gray-800">Course created successfully.</p>
        <p className="max-w-md text-sm text-gray-500">
          Your course shell is ready. Continue building its content in Studio.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Close
            </Button>
          )}
          <a
            href={`${config.urls.studioUrl()}/course/${createdCourseKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-sm font-medium text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
          >
            Continue editing in Studio
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <Label htmlFor="course-name">Course name *</Label>
        <Input
          id="course-name"
          maxLength={100}
          value={fields.display_name}
          onChange={(event) => setField('display_name', event.target.value)}
          placeholder="e.g. Introduction to Data Science"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="course-description">Description *</Label>
        <Textarea
          id="course-description"
          maxLength={5000}
          rows={5}
          value={fields.description}
          onChange={(event) => setField('description', event.target.value)}
          placeholder="What will learners get out of this course?"
        />
      </div>

      <div className="mt-8 flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={() => void handleFormSubmit()}
          disabled={submitting}
          className="bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Course
        </Button>
      </div>
    </div>
  );
}
