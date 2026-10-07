'use client';

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useLazyGetStudentProgressUrlQuery,
  useOverrideProblemScoreMutation,
  useRescoreProblemMutation,
  useResetStudentAttemptsMutation,
} from '@/services/instructor';
import { Notice, SectionCard, errorMessage } from './instructor-ui';

type Message = { tone: 'success' | 'error'; text: string } | null;

export function AttemptsSection({ courseId }: { courseId: string }) {
  const [identifier, setIdentifier] = useState('');
  const [problem, setProblem] = useState('');
  const [score, setScore] = useState('');
  const [message, setMessage] = useState<Message>(null);
  const [courseWideMessage, setCourseWideMessage] = useState<Message>(null);
  const [confirmCourseWide, setConfirmCourseWide] = useState<'reset' | 'rescore' | null>(null);

  const [lookupProgress, { data: progress, isFetching: loadingProgress }] =
    useLazyGetStudentProgressUrlQuery();
  const [resetAttempts, { isLoading: resetting }] = useResetStudentAttemptsMutation();
  const [rescore, { isLoading: rescoring }] = useRescoreProblemMutation();
  const [overrideScore, { isLoading: overriding }] = useOverrideProblemScoreMutation();
  const busy = resetting || rescoring || overriding;

  const run = async (setter: (m: Message) => void, work: () => Promise<string>) => {
    setter(null);
    try {
      setter({ tone: 'success', text: await work() });
    } catch (error) {
      setter({ tone: 'error', text: errorMessage(error, 'The action failed') });
    }
  };

  const learner = identifier.trim();
  const location = problem.trim();

  return (
    <div className="space-y-4" data-testid="attempts-section">
      <SectionCard
        title="Learner"
        description="Look a learner up by email or username; their progress page opens in a new tab."
      >
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (learner) lookupProgress({ courseId, identifier: learner });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="learner-identifier">Email or username</Label>
            <Input
              id="learner-identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="h-9 w-72"
            />
          </div>
          <Button type="submit" variant="outline" disabled={loadingProgress || !learner}>
            {loadingProgress ? 'Looking up…' : 'Find progress page'}
          </Button>
          {progress?.progress_url && (
            <a
              href={progress.progress_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1 text-sm font-medium text-amber-600 hover:underline"
            >
              Open progress page <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </form>
      </SectionCard>

      <SectionCard
        title="Problem attempts"
        description="Reset, rescore or override one learner's score on a single problem. Paste the problem's location id (block-v1:… type@problem+block@…) from Studio."
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="problem-location">Problem location</Label>
            <Input
              id="problem-location"
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              placeholder="block-v1:org+course+run+type@problem+block@…"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="problem-score">Score override</Label>
            <Input
              id="problem-score"
              type="number"
              min={0}
              step="any"
              value={score}
              onChange={(event) => setScore(event.target.value)}
              className="h-9 w-32"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy || !learner || !location}
            onClick={() =>
              run(setMessage, async () => {
                await resetAttempts({
                  courseId,
                  problemLocation: location,
                  identifier: learner,
                }).unwrap();
                return `Attempts reset for ${learner}`;
              })
            }
          >
            Reset attempts
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !learner || !location}
            onClick={() =>
              run(setMessage, async () => {
                await resetAttempts({
                  courseId,
                  problemLocation: location,
                  identifier: learner,
                  deleteModule: true,
                }).unwrap();
                return `State deleted for ${learner} — the problem starts fresh`;
              })
            }
          >
            Delete learner state
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !learner || !location}
            onClick={() =>
              run(setMessage, async () => {
                await rescore({
                  courseId,
                  problemLocation: location,
                  identifier: learner,
                }).unwrap();
                return `Rescore queued for ${learner}`;
              })
            }
          >
            Rescore
          </Button>
          <Button
            type="button"
            disabled={busy || !learner || !location || score.trim() === ''}
            onClick={() =>
              run(setMessage, async () => {
                await overrideScore({
                  courseId,
                  problemLocation: location,
                  identifier: learner,
                  score: Number(score),
                }).unwrap();
                return `Score override queued for ${learner}`;
              })
            }
          >
            Override score
          </Button>
        </div>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
      </SectionCard>

      <SectionCard
        title="Course-wide actions"
        description="Apply to every learner in the course. These run in the background and show up under Reports › Pending tasks."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy || !location}
            onClick={() => setConfirmCourseWide('reset')}
          >
            Reset attempts for all learners
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !location}
            onClick={() => setConfirmCourseWide('rescore')}
          >
            Rescore for all learners
          </Button>
        </div>
        {confirmCourseWide && (
          <Notice tone="info">
            <span className="mr-3">
              {confirmCourseWide === 'reset' ? 'Reset attempts' : 'Rescore'} on this problem for{' '}
              <strong>every learner</strong>?
            </span>
            <Button
              type="button"
              size="sm"
              className="mr-2"
              disabled={busy}
              onClick={() => {
                const action = confirmCourseWide;
                setConfirmCourseWide(null);
                run(setCourseWideMessage, async () => {
                  if (action === 'reset') {
                    await resetAttempts({
                      courseId,
                      problemLocation: location,
                      allStudents: true,
                    }).unwrap();
                    return 'Course-wide reset queued';
                  }
                  await rescore({
                    courseId,
                    problemLocation: location,
                    allStudents: true,
                  }).unwrap();
                  return 'Course-wide rescore queued';
                });
              }}
            >
              Yes, continue
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setConfirmCourseWide(null)}
            >
              Cancel
            </Button>
          </Notice>
        )}
        {courseWideMessage && (
          <Notice tone={courseWideMessage.tone}>{courseWideMessage.text}</Notice>
        )}
      </SectionCard>
    </div>
  );
}
