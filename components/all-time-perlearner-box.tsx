'use client';
import { Award, BookOpen, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useTenantParam } from '@/hooks/use-tenant-param';

interface AllTimePerLearnerBoxProps {
  total_time_spent: number;
  courses: number;
  credentials: number;
  skills: number;
}

export const AllTimePerLearnerBox = ({
  total_time_spent,
  courses,
  credentials,
  skills,
}: AllTimePerLearnerBoxProps) => {
  const tenant = useTenantParam();
  const hours =
    typeof total_time_spent === 'number' && !isNaN(total_time_spent)
      ? Math.round(total_time_spent / 3600)
      : 0;

  return (
    <div className="mb-4 rounded-md border border-[var(--sidebar-border)] p-4">
      <h3 className="mb-3 text-sm font-medium text-[var(--sidebar-text)] md:text-base">
        Highlights
      </h3>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[var(--sidebar-icon-bg)]">
              <Clock className="h-3 w-3 text-[var(--sidebar-icon-color)]" />
            </div>
            <span className="text-xs text-[var(--sidebar-text)]">Time Spent</span>
          </div>
          <span className="text-xs font-medium text-[var(--text-dark)]">{hours} hours</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[var(--sidebar-icon-bg)]">
              <BookOpen className="h-3 w-3 text-[var(--sidebar-icon-color)]" />
            </div>
            <span className="text-xs text-[var(--sidebar-text)]">Courses</span>
          </div>
          <Link
            href={`/platform/${tenant}/profile/courses`}
            aria-label="View courses"
            className="text-xs font-medium text-[var(--text-dark)] hover:underline"
          >
            {courses}
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[var(--sidebar-icon-bg)]">
              <Award className="h-3 w-3 text-[var(--sidebar-icon-color)]" />
            </div>
            <span className="text-xs text-[var(--sidebar-text)]">Credentials</span>
          </div>
          <Link
            href={`/platform/${tenant}/profile/credentials`}
            aria-label="View credentials"
            className="text-xs font-medium text-[var(--text-dark)] hover:underline"
          >
            {credentials}
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[var(--sidebar-icon-bg)]">
              <Sparkles className="h-3 w-3 text-[var(--sidebar-icon-color)]" />
            </div>
            <span className="text-xs text-[var(--sidebar-text)]">Skills</span>
          </div>
          <Link
            href={`/platform/${tenant}/profile/skills`}
            aria-label="View skills"
            className="text-xs font-medium text-[var(--text-dark)] hover:underline"
          >
            {skills}
          </Link>
        </div>
      </div>
    </div>
  );
};
