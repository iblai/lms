'use client';

import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserDisplayName } from '@/components/user-display-name';
import {
  useGenerateReportMutation,
  useListInstructorTasksQuery,
  useListReportDownloadsQuery,
  type ReportKind,
} from '@/services/instructor';
import { config } from '@/lib/config';
import { Notice, SectionCard, errorMessage } from './instructor-ui';

const REPORTS: Array<{ kind: ReportKind; label: string; hint: string }> = [
  { kind: 'calculate_grades_csv', label: 'Grade report', hint: 'Every learner’s course grade.' },
  {
    kind: 'problem_grade_report',
    label: 'Problem grade report',
    hint: 'Scores on every graded problem.',
  },
  {
    kind: 'get_students_features',
    label: 'Enrolled learners',
    hint: 'Profile information for everyone enrolled.',
  },
  { kind: 'get_anon_ids', label: 'Anonymised IDs', hint: 'Map of learners to anonymous ids.' },
  {
    kind: 'get_issued_certificates',
    label: 'Issued certificates',
    hint: 'Certificates issued so far.',
  },
];

/** The LMS hands back `/media/…` paths for locally stored reports; S3 ones are already absolute. */
export const downloadHref = (url: string) => new URL(url, config.urls.lms()).toString();

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export function ReportsSection({ courseId }: { courseId: string }) {
  const [problemLocation, setProblemLocation] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [generate, { isLoading: generating }] = useGenerateReportMutation();
  const {
    data: downloads = [],
    isFetching: loadingDownloads,
    refetch: refetchDownloads,
  } = useListReportDownloadsQuery({ courseId });
  const {
    data: tasks = [],
    isFetching: loadingTasks,
    refetch: refetchTasks,
  } = useListInstructorTasksQuery({ courseId });

  const request = async (kind: ReportKind, label: string) => {
    setMessage(null);
    try {
      await generate({
        courseId,
        report: kind,
        problemLocation: kind === 'get_problem_responses' ? problemLocation.trim() : undefined,
      }).unwrap();
      setMessage({
        tone: 'success',
        text: `${label} queued — it appears under Downloads when ready.`,
      });
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error, `Could not generate the ${label}`) });
    }
  };

  const refresh = () => {
    refetchDownloads();
    refetchTasks();
  };

  return (
    <div className="space-y-4" data-testid="reports-section">
      <SectionCard
        title="Generate a report"
        description="Reports are built in the background and listed below once they're ready."
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {REPORTS.map((report) => (
            <li
              key={report.kind}
              className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2"
            >
              <span>
                <span className="block text-sm font-medium text-gray-900">{report.label}</span>
                <span className="block text-xs text-gray-500">{report.hint}</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={generating}
                onClick={() => request(report.kind, report.label)}
              >
                Generate
              </Button>
            </li>
          ))}
          <li className="flex flex-wrap items-end gap-2 rounded-md border border-gray-200 px-3 py-2 sm:col-span-2">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="responses-problem" className="text-sm font-medium text-gray-900">
                Problem responses
              </Label>
              <Input
                id="responses-problem"
                value={problemLocation}
                onChange={(event) => setProblemLocation(event.target.value)}
                placeholder="Problem location (block-v1:… type@problem+block@…)"
                className="h-9"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={generating || problemLocation.trim() === ''}
              onClick={() => request('get_problem_responses', 'Problem responses report')}
            >
              Generate
            </Button>
          </li>
        </ul>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
      </SectionCard>

      <SectionCard
        title="Downloads"
        description="Generated reports, newest first."
        actions={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={refresh}
            disabled={loadingDownloads || loadingTasks}
            aria-label="Refresh reports"
          >
            <RefreshCw
              className={loadingDownloads || loadingTasks ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
            />
          </Button>
        }
      >
        {downloads.length === 0 ? (
          <p className="text-sm text-gray-500">No reports yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100" data-testid="report-downloads">
            {downloads.map((download) => (
              <li key={download.name} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate text-sm text-gray-800">{download.name}</span>
                <a
                  href={downloadHref(download.url)}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-amber-600 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden /> Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Pending tasks"
        description="Background jobs still running for this course."
      >
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing running.</p>
        ) : (
          <table className="w-full text-sm" data-testid="pending-tasks">
            <thead className="text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="py-1.5 pr-3">Task</th>
                <th className="py-1.5 pr-3">Requested by</th>
                <th className="py-1.5 pr-3">Started</th>
                <th className="py-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.task_id} className="border-t border-gray-100">
                  <td className="py-2 pr-3 text-gray-800">{task.task_type}</td>
                  <td className="py-2 pr-3 text-gray-600">
                    <UserDisplayName username={task.requester} />
                  </td>
                  <td className="py-2 pr-3 text-gray-600">{formatDate(task.created)}</td>
                  <td className="py-2 text-gray-600">{task.status || task.task_state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
