'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  useBulkBetaModifyAccessMutation,
  useListCourseRoleMembersQuery,
  useListForumMembersQuery,
  useModifyAccessMutation,
  useUpdateEnrollmentMutation,
  useUpdateForumRoleMembershipMutation,
} from '@/services/instructor';
import type {
  CourseRole,
  EnrollmentChangeResponse,
  EnrollmentChangeResult,
  ForumRole,
} from '@/types/instructor';
import { MembersTable, Notice, SectionCard, errorMessage } from './instructor-ui';

const COURSE_ROLES: Array<{ value: CourseRole; label: string; hint: string }> = [
  {
    value: 'staff',
    label: 'Staff',
    hint: 'Can view and manage the course, but not change the team.',
  },
  { value: 'instructor', label: 'Admin', hint: 'Full control, including the course team.' },
  { value: 'beta', label: 'Beta testers', hint: 'See content before its release date.' },
  { value: 'data_researcher', label: 'Data researchers', hint: 'Can download course data.' },
];
const FORUM_ROLES: ForumRole[] = ['Administrator', 'Moderator', 'Group Moderator', 'Community TA'];

/** One line per identifier describing what the enrollment call changed. */
export const describeEnrollmentResult = (
  result: EnrollmentChangeResult,
  action: EnrollmentChangeResponse['action'],
) => {
  if (result.invalidIdentifier) return `${result.identifier}: not a valid email or username`;
  if (result.error) return `${result.identifier}: something went wrong`;
  if (action === 'enroll') {
    if (result.after.enrollment) {
      return result.before.enrollment
        ? `${result.identifier}: already enrolled`
        : `${result.identifier}: enrolled`;
    }
    if (result.after.allowed) {
      return `${result.identifier}: no account yet — will be enrolled on sign-up`;
    }
    return `${result.identifier}: no account found`;
  }
  if (result.before.enrollment && !result.after.enrollment) {
    return `${result.identifier}: unenrolled`;
  }
  return `${result.identifier}: was not enrolled`;
};

const EnrollmentCard = ({ courseId }: { courseId: string }) => {
  const [identifiers, setIdentifiers] = useState('');
  const [action, setAction] = useState<'enroll' | 'unenroll'>('enroll');
  const [autoEnroll, setAutoEnroll] = useState(true);
  const [emailStudents, setEmailStudents] = useState(false);
  const [outcome, setOutcome] = useState<EnrollmentChangeResponse | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [updateEnrollment, { isLoading }] = useUpdateEnrollmentMutation();

  const submit = async () => {
    setFailure(null);
    setOutcome(null);
    try {
      const response = await updateEnrollment({
        courseId,
        identifiers: identifiers.trim(),
        action,
        autoEnroll,
        emailStudents,
      }).unwrap();
      setOutcome(response);
      setIdentifiers('');
    } catch (error) {
      setFailure(errorMessage(error, 'The enrollment change failed'));
    }
  };

  return (
    <SectionCard
      title="Enrollment"
      description="Enroll or unenroll learners by email address or username, one per line or comma-separated."
    >
      <div className="space-y-1.5">
        <Label htmlFor="enroll-identifiers">Learners</Label>
        <Textarea
          id="enroll-identifiers"
          rows={3}
          value={identifiers}
          onChange={(event) => setIdentifiers(event.target.value)}
          placeholder="ada@example.org, grace@example.org"
        />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-gray-600">Action</span>
          <NativeSelect
            value={action}
            onChange={(event) => setAction(event.target.value as 'enroll' | 'unenroll')}
            aria-label="Enrollment action"
          >
            <option value="enroll">Enroll</option>
            <option value="unenroll">Unenroll</option>
          </NativeSelect>
        </label>
        <label className="flex items-center gap-2 text-gray-600">
          <input
            type="checkbox"
            checked={autoEnroll}
            onChange={(event) => setAutoEnroll(event.target.checked)}
            className="accent-amber-500"
          />
          Auto-enroll when they sign up
        </label>
        <label className="flex items-center gap-2 text-gray-600">
          <input
            type="checkbox"
            checked={emailStudents}
            onChange={(event) => setEmailStudents(event.target.checked)}
            className="accent-amber-500"
          />
          Notify by email
        </label>
        <Button
          type="button"
          onClick={submit}
          disabled={isLoading || identifiers.trim() === ''}
          className="ml-auto"
        >
          {isLoading ? 'Working…' : action === 'enroll' ? 'Enroll' : 'Unenroll'}
        </Button>
      </div>
      {failure && <Notice tone="error">{failure}</Notice>}
      {outcome && (
        <Notice tone="success">
          <ul className="space-y-0.5" data-testid="enrollment-results">
            {outcome.results.map((result) => (
              <li key={result.identifier}>{describeEnrollmentResult(result, outcome.action)}</li>
            ))}
          </ul>
        </Notice>
      )}
    </SectionCard>
  );
};

const CourseTeamCard = ({ courseId }: { courseId: string }) => {
  const [role, setRole] = useState<CourseRole>('staff');
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const { data: members = [], isLoading } = useListCourseRoleMembersQuery({
    courseId,
    rolename: role,
  });
  const [modifyAccess, { isLoading: modifying }] = useModifyAccessMutation();
  const [betaAccess, { isLoading: betaModifying }] = useBulkBetaModifyAccessMutation();
  const busy = modifying || betaModifying;
  const roleInfo = COURSE_ROLES.find((entry) => entry.value === role)!;

  const change = async (target: string, grant: boolean) => {
    setMessage(null);
    try {
      if (role === 'beta') {
        await betaAccess({
          courseId,
          identifiers: target,
          action: grant ? 'add' : 'remove',
          emailStudents: false,
          autoEnroll: true,
        }).unwrap();
      } else {
        await modifyAccess({
          courseId,
          identifier: target,
          rolename: role,
          action: grant ? 'allow' : 'revoke',
        }).unwrap();
      }
      setMessage({
        tone: 'success',
        text: grant ? `${target} added as ${roleInfo.label}` : `${target} removed`,
      });
      if (grant) setIdentifier('');
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error, 'The change failed') });
    }
  };

  return (
    <SectionCard
      title="Course team"
      description={roleInfo.hint}
      actions={
        <NativeSelect
          value={role}
          onChange={(event) => {
            setRole(event.target.value as CourseRole);
            setMessage(null);
          }}
          aria-label="Course role"
        >
          {COURSE_ROLES.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </NativeSelect>
      }
    >
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (identifier.trim()) change(identifier.trim(), true);
        }}
      >
        <Input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Email or username"
          aria-label={`Add ${roleInfo.label}`}
          className="h-9 w-72"
        />
        <Button type="submit" disabled={busy || identifier.trim() === ''}>
          Add
        </Button>
      </form>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <MembersTable
          members={members}
          emptyText={`Nobody holds the ${roleInfo.label} role yet.`}
          onRemove={(member) => change(member.email || member.username, false)}
          removing={busy}
        />
      )}
    </SectionCard>
  );
};

const ForumRolesCard = ({ courseId }: { courseId: string }) => {
  const [role, setRole] = useState<ForumRole>('Moderator');
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const { data: members = [], isLoading } = useListForumMembersQuery({ courseId, rolename: role });
  const [updateRole, { isLoading: updating }] = useUpdateForumRoleMembershipMutation();

  const change = async (target: string, grant: boolean) => {
    setMessage(null);
    try {
      await updateRole({
        courseId,
        identifier: target,
        rolename: role,
        action: grant ? 'allow' : 'revoke',
      }).unwrap();
      setMessage({
        tone: 'success',
        text: grant ? `${target} is now a ${role}` : `${target} removed`,
      });
      if (grant) setIdentifier('');
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error, 'The change failed') });
    }
  };

  return (
    <SectionCard
      title="Discussion roles"
      description="Who moderates and administers the course discussions."
      actions={
        <NativeSelect
          value={role}
          onChange={(event) => {
            setRole(event.target.value as ForumRole);
            setMessage(null);
          }}
          aria-label="Discussion role"
        >
          {FORUM_ROLES.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </NativeSelect>
      }
    >
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (identifier.trim()) change(identifier.trim(), true);
        }}
      >
        <Input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Email or username"
          aria-label={`Add ${role}`}
          className="h-9 w-72"
        />
        <Button type="submit" disabled={updating || identifier.trim() === ''}>
          Add
        </Button>
      </form>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <MembersTable
          members={members}
          emptyText={`No ${role} yet.`}
          onRemove={(member) => change(member.email || member.username, false)}
          removing={updating}
        />
      )}
    </SectionCard>
  );
};

export function MembershipSection({ courseId }: { courseId: string }) {
  return (
    <div className="space-y-4" data-testid="membership-section">
      <EnrollmentCard courseId={courseId} />
      <CourseTeamCard courseId={courseId} />
      <ForumRolesCard courseId={courseId} />
    </div>
  );
}
