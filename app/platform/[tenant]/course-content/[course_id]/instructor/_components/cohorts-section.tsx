'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useAddCohortUsersMutation,
  useCreateCohortMutation,
  useGetCohortSettingsQuery,
  useGetCohortsQuery,
  useRemoveCohortUserMutation,
  useUpdateCohortMutation,
  useUpdateCohortSettingsMutation,
} from '@/services/instructor';
import type { Cohort, CohortUsersResult } from '@/types/instructor';
import { Notice, SectionCard, errorMessage } from './instructor-ui';

/** Human summary of what an add-users call did. */
export const describeCohortUsersResult = (result: CohortUsersResult) => {
  const parts: string[] = [];
  if (result.added?.length) parts.push(`${result.added.length} added`);
  if (result.changed?.length) parts.push(`${result.changed.length} moved from another cohort`);
  if (result.present?.length) parts.push(`${result.present.length} already here`);
  if (result.preassigned?.length)
    parts.push(`${result.preassigned.length} pre-assigned (no account yet)`);
  if (result.unknown?.length) parts.push(`unknown: ${result.unknown.join(', ')}`);
  if (result.invalid?.length) parts.push(`invalid: ${result.invalid.join(', ')}`);
  return parts.length > 0 ? parts.join(' · ') : 'Nothing changed';
};

const CohortRow = ({ courseId, cohort }: { courseId: string; cohort: Cohort }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(cohort.name);
  const [users, setUsers] = useState('');
  const [removeUsername, setRemoveUsername] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [updateCohort, { isLoading: saving }] = useUpdateCohortMutation();
  const [addUsers, { isLoading: adding }] = useAddCohortUsersMutation();
  const [removeUser, { isLoading: removing }] = useRemoveCohortUserMutation();

  const run = async (work: () => Promise<string>) => {
    setMessage(null);
    try {
      setMessage({ tone: 'success', text: await work() });
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error, 'The change failed') });
    }
  };

  return (
    <li className="rounded-md border border-gray-200" data-testid="cohort-row">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
      >
        <span>
          <span className="font-medium text-gray-900">{cohort.name}</span>
          <span className="ml-2 text-xs text-gray-500">
            {cohort.user_count} {cohort.user_count === 1 ? 'learner' : 'learners'} ·{' '}
            {cohort.assignment_type === 'random' ? 'auto-assigned' : 'manual'}
          </span>
        </span>
        <span className="text-xs text-amber-600">{open ? 'Close' : 'Manage'}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-gray-100 px-3 py-3">
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                await updateCohort({ courseId, cohortId: cohort.id, name: name.trim() }).unwrap();
                return 'Cohort renamed';
              });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor={`cohort-name-${cohort.id}`}>Name</Label>
              <Input
                id={`cohort-name-${cohort.id}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-9 w-64"
              />
            </div>
            <Button type="submit" variant="outline" disabled={saving || name.trim() === ''}>
              Rename
            </Button>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <span>Assignment</span>
              <NativeSelect
                value={cohort.assignment_type}
                onChange={(event) =>
                  run(async () => {
                    await updateCohort({
                      courseId,
                      cohortId: cohort.id,
                      assignmentType: event.target.value as 'manual' | 'random',
                    }).unwrap();
                    return 'Assignment type updated';
                  })
                }
                aria-label={`Assignment type for ${cohort.name}`}
              >
                <option value="manual">Manual</option>
                <option value="random">Automatic (random)</option>
              </NativeSelect>
            </label>
          </form>
          <form
            className="space-y-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                const list = users
                  .split(/[\s,;]+/)
                  .map((value) => value.trim())
                  .filter(Boolean);
                const result = await addUsers({
                  courseId,
                  cohortId: cohort.id,
                  users: list,
                }).unwrap();
                setUsers('');
                return describeCohortUsersResult(result);
              });
            }}
          >
            <Label htmlFor={`cohort-users-${cohort.id}`}>Add learners</Label>
            <Textarea
              id={`cohort-users-${cohort.id}`}
              rows={2}
              value={users}
              onChange={(event) => setUsers(event.target.value)}
              placeholder="Usernames or emails, separated by commas or new lines"
            />
            <Button type="submit" disabled={adding || users.trim() === ''}>
              Add to cohort
            </Button>
          </form>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                await removeUser({
                  courseId,
                  cohortId: cohort.id,
                  username: removeUsername.trim(),
                }).unwrap();
                setRemoveUsername('');
                return `${removeUsername.trim()} removed from ${cohort.name}`;
              });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor={`cohort-remove-${cohort.id}`}>Remove a learner</Label>
              <Input
                id={`cohort-remove-${cohort.id}`}
                value={removeUsername}
                onChange={(event) => setRemoveUsername(event.target.value)}
                placeholder="Username"
                className="h-9 w-64"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={removing || removeUsername.trim() === ''}
            >
              Remove
            </Button>
          </form>
          {message && <Notice tone={message.tone}>{message.text}</Notice>}
        </div>
      )}
    </li>
  );
};

export function CohortsSection({ courseId }: { courseId: string }) {
  const { data: settings } = useGetCohortSettingsQuery({ courseId });
  const { data: cohorts = [], isLoading } = useGetCohortsQuery({ courseId });
  const [updateSettings, { isLoading: toggling }] = useUpdateCohortSettingsMutation();
  const [createCohort, { isLoading: creating }] = useCreateCohortMutation();
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'manual' | 'random'>('manual');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const enabled = settings?.is_cohorted === true;

  const toggle = async (checked: boolean) => {
    setMessage(null);
    try {
      await updateSettings({ courseId, isCohorted: checked }).unwrap();
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error, 'Could not update cohort settings') });
    }
  };

  const create = async () => {
    setMessage(null);
    try {
      await createCohort({ courseId, name: newName.trim(), assignmentType: newType }).unwrap();
      setMessage({ tone: 'success', text: `Cohort "${newName.trim()}" created` });
      setNewName('');
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error, 'Could not create the cohort') });
    }
  };

  return (
    <div className="space-y-4" data-testid="cohorts-section">
      <SectionCard
        title="Cohorts"
        description="Split learners into groups for discussions and cohort-specific content."
        actions={
          <label className="flex items-center gap-2 text-sm text-gray-600">
            {enabled ? 'Enabled' : 'Disabled'}
            <Switch
              checked={enabled}
              onCheckedChange={toggle}
              disabled={toggling || !settings}
              aria-label="Enable cohorts"
              className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-gray-300"
            />
          </label>
        }
      >
        {enabled ? (
          <>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                create();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="new-cohort-name">New cohort</Label>
                <Input
                  id="new-cohort-name"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Cohort name"
                  className="h-9 w-64"
                />
              </div>
              <NativeSelect
                value={newType}
                onChange={(event) => setNewType(event.target.value as 'manual' | 'random')}
                aria-label="New cohort assignment type"
              >
                <option value="manual">Manual</option>
                <option value="random">Automatic (random)</option>
              </NativeSelect>
              <Button type="submit" disabled={creating || newName.trim() === ''}>
                Create
              </Button>
            </form>
            {message && <Notice tone={message.tone}>{message.text}</Notice>}
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : cohorts.length === 0 ? (
              <p className="text-sm text-gray-500">No cohorts yet.</p>
            ) : (
              <ul className="space-y-2">
                {cohorts.map((cohort) => (
                  <CohortRow key={cohort.id} courseId={courseId} cohort={cohort} />
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            {message && <Notice tone={message.tone}>{message.text}</Notice>}
            <p className="text-sm text-gray-500">
              Turn cohorts on to create groups and assign learners to them.
            </p>
          </>
        )}
      </SectionCard>
    </div>
  );
}
