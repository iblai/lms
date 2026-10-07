'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import {
  useChangeDueDateMutation,
  useGetGradingInfoQuery,
  useLazyShowStudentExtensionsQuery,
  useLazyShowUnitExtensionsQuery,
  useResetDueDateMutation,
} from '@/services/instructor';
import type { DueDateExtension } from '@/types/instructor';
import { UserDisplayName } from '@/components/user-display-name';
import { Notice, SectionCard, errorMessage } from './instructor-ui';

/** The LMS wants `YYYY-MM-DD HH:MM`; `<input type="datetime-local">` gives `YYYY-MM-DDTHH:MM`. */
export const toLmsDatetime = (value: string) => value.replace('T', ' ');

// The LMS reports unit extensions as `Username` + `Full Name` columns; staff
// see one "Learner" column resolved to the profile name (or email) instead.
const USERNAME_COLUMN = 'Username';
const FULL_NAME_COLUMN = 'Full Name';

const ExtensionsTable = ({ extension }: { extension: DueDateExtension }) => {
  const columns = extension.header.filter((column) => column !== FULL_NAME_COLUMN);
  return (
    <div data-testid="extensions-table">
      <p className="mb-1 text-sm font-medium text-gray-800">{extension.title}</p>
      {extension.data.length === 0 ? (
        <p className="text-sm text-gray-500">No extensions.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
            <tr>
              {columns.map((column) => (
                <th key={column} className="py-1.5 pr-3">
                  {column === USERNAME_COLUMN ? 'Learner' : column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {extension.data.map((row, index) => (
              <tr key={index} className="border-t border-gray-100">
                {columns.map((column) => (
                  <td key={column} className="py-2 pr-3 text-gray-700">
                    {column === USERNAME_COLUMN ? (
                      <UserDisplayName username={row[column]} fallback={row[FULL_NAME_COLUMN]} />
                    ) : (
                      row[column]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export function ExtensionsSection({ courseId }: { courseId: string }) {
  const { data: gradingInfo } = useGetGradingInfoQuery({ courseId });
  const subsections = gradingInfo?.subsections ?? [];
  const [identifier, setIdentifier] = useState('');
  const [unit, setUnit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [changeDueDate, { isLoading: changing }] = useChangeDueDateMutation();
  const [resetDueDate, { isLoading: resetting }] = useResetDueDateMutation();
  const [lookupStudent, { data: studentExtensions, isFetching: loadingStudent }] =
    useLazyShowStudentExtensionsQuery();
  const [lookupUnit, { data: unitExtensions, isFetching: loadingUnit }] =
    useLazyShowUnitExtensionsQuery();

  const run = async (work: () => Promise<string>) => {
    setMessage(null);
    try {
      setMessage({ tone: 'success', text: await work() });
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error, 'The change failed') });
    }
  };

  const unitName = subsections.find((s) => s.module_id === unit)?.display_name ?? unit;

  return (
    <div className="space-y-4" data-testid="extensions-section">
      <SectionCard
        title="Due date extensions"
        description="Give one learner more time on a subsection, or take an extension back."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="extension-learner">Learner (email or username)</Label>
            <Input
              id="extension-learner"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="extension-unit">Subsection</Label>
            <NativeSelect
              id="extension-unit"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              className="w-full"
            >
              <option value="">Choose a subsection…</option>
              {subsections.map((subsection) => (
                <option key={subsection.module_id} value={subsection.module_id}>
                  {subsection.display_name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="extension-due">New due date</Label>
            <Input
              id="extension-due"
              type="datetime-local"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="h-9"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={changing || !identifier.trim() || !unit || !dueDate}
            onClick={() =>
              run(async () => {
                await changeDueDate({
                  courseId,
                  identifier: identifier.trim(),
                  unitLocation: unit,
                  dueDatetime: toLmsDatetime(dueDate),
                }).unwrap();
                return `Due date for "${unitName}" extended for ${identifier.trim()}`;
              })
            }
          >
            Extend due date
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={resetting || !identifier.trim() || !unit}
            onClick={() =>
              run(async () => {
                await resetDueDate({
                  courseId,
                  identifier: identifier.trim(),
                  unitLocation: unit,
                }).unwrap();
                return `Extension on "${unitName}" removed for ${identifier.trim()}`;
              })
            }
          >
            Reset to course due date
          </Button>
        </div>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
      </SectionCard>

      <SectionCard
        title="Current extensions"
        description="Look up extensions by learner or by subsection."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loadingStudent || !identifier.trim()}
            onClick={() => lookupStudent({ courseId, identifier: identifier.trim() })}
          >
            {loadingStudent ? 'Loading…' : 'Show learner’s extensions'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loadingUnit || !unit}
            onClick={() => lookupUnit({ courseId, unitLocation: unit })}
          >
            {loadingUnit ? 'Loading…' : 'Show subsection extensions'}
          </Button>
        </div>
        {studentExtensions && <ExtensionsTable extension={studentExtensions} />}
        {unitExtensions && <ExtensionsTable extension={unitExtensions} />}
      </SectionCard>
    </div>
  );
}
