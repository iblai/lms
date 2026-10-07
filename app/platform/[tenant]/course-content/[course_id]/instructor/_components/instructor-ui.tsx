'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { CourseRoleMember } from '@/types/instructor';
import { UserDisplayName } from '@/components/user-display-name';

export const SectionCard = ({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={cn('rounded-lg border border-gray-200 bg-white', className)}
    aria-labelledby={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
  >
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
      <div>
        <h3
          id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="text-sm font-semibold text-gray-900"
        >
          {title}
        </h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      {actions}
    </header>
    <div className="space-y-4 px-4 py-4">{children}</div>
  </section>
);

export const StatCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
  </div>
);

export const memberName = (member: CourseRoleMember) =>
  [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email;

export const MembersTable = ({
  members,
  emptyText,
  onRemove,
  removing,
}: {
  members: CourseRoleMember[];
  emptyText: string;
  onRemove?: (member: CourseRoleMember) => void;
  removing?: boolean;
}) => {
  if (members.length === 0) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }
  return (
    <table className="w-full text-sm" data-testid="members-table">
      <thead className="text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
        <tr>
          <th className="py-1.5 pr-3">Name</th>
          <th className="py-1.5 pr-3">Email</th>
          {onRemove && <th className="py-1.5" />}
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <tr key={member.username} className="border-t border-gray-100">
            <td className="py-2 pr-3 text-gray-900">
              <UserDisplayName username={member.username} fallback={memberName(member)} />
            </td>
            <td className="py-2 pr-3 text-gray-600">{member.email}</td>
            {onRemove && (
              <td className="py-2 text-right">
                <button
                  type="button"
                  onClick={() => onRemove(member)}
                  disabled={removing}
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/** Message shown under a form after an API call; `tone` picks the colour. */
export const Notice = ({
  tone,
  children,
}: {
  tone: 'success' | 'error' | 'info';
  children: ReactNode;
}) => (
  <p
    role={tone === 'error' ? 'alert' : 'status'}
    className={cn(
      'rounded-md border px-3 py-2 text-sm',
      tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
      tone === 'error' && 'border-red-200 bg-red-50 text-red-700',
      tone === 'info' && 'border-gray-200 bg-gray-50 text-gray-700',
    )}
  >
    {children}
  </p>
);

export const errorMessage = (error: unknown, fallback: string) =>
  (error as { message?: string })?.message || fallback;
