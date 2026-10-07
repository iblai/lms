'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBulkUpdateGradesMutation, useGetSubsectionGradeQuery } from '@/services/instructor';
import type { GradebookRow, GradingSubsection } from '@/types/instructor';
import { useUserDisplayName } from '@/hooks/users/use-user-display-name';

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : '');

export function GradeOverrideDialog({
  courseId,
  row,
  subsection,
  onClose,
}: {
  courseId: string;
  row: GradebookRow;
  subsection: GradingSubsection;
  onClose: () => void;
}) {
  const current = row.section_breakdown.find((entry) => entry.module_id === subsection.module_id);
  const [earned, setEarned] = useState(current ? String(current.score_earned) : '');
  const [comment, setComment] = useState('');
  const { data: history } = useGetSubsectionGradeQuery({
    usageId: subsection.module_id,
    userId: row.user_id,
  });
  const [bulkUpdate, { isLoading }] = useBulkUpdateGradesMutation();
  const learnerName = useUserDisplayName(row.username, row.full_name || row.email);

  const possible = current?.score_possible ?? 0;
  const value = Number(earned);
  const valid = earned.trim() !== '' && Number.isFinite(value) && value >= 0 && value <= possible;

  const submit = async () => {
    try {
      const results = await bulkUpdate({
        courseId,
        updates: [
          {
            user_id: row.user_id,
            usage_id: subsection.module_id,
            grade: {
              earned_graded_override: value,
              possible_graded_override: possible,
              comment: comment.trim() || undefined,
            },
          },
        ],
      }).unwrap();
      const failure = results.find((result) => !result.success);
      if (failure) {
        toast.error(failure.reason || 'The grade could not be overridden');
        return;
      }
      toast.success(`Grade updated for ${learnerName}`);
      onClose();
    } catch (error) {
      toast.error((error as Error).message || 'The grade could not be overridden');
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="grade-override-dialog">
        <DialogHeader>
          <DialogTitle>Override grade</DialogTitle>
          <DialogDescription>
            {learnerName} · {subsection.display_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Current score</p>
              <p className="font-semibold text-gray-900">
                {current ? `${current.score_earned} / ${current.score_possible}` : '–'}
              </p>
            </div>
            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Original (before overrides)</p>
              <p className="font-semibold text-gray-900">
                {history?.original_grade
                  ? `${history.original_grade.earned_graded} / ${history.original_grade.possible_graded}`
                  : '–'}
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="override-earned">New score (out of {possible})</Label>
            <Input
              id="override-earned"
              type="number"
              min={0}
              max={possible}
              step="any"
              value={earned}
              onChange={(event) => setEarned(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="override-comment">Reason (optional)</Label>
            <Textarea
              id="override-comment"
              rows={2}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Visible in the override history"
            />
          </div>
          {history?.history && history.history.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium tracking-wide text-gray-500 uppercase">
                History
              </p>
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-gray-600">
                {history.history.map((entry, index) => (
                  <li key={`${entry.created}-${index}`} className="rounded bg-gray-50 px-2 py-1">
                    <span className="font-medium text-gray-800">
                      {entry.earned_graded_override} / {entry.possible_graded_override}
                    </span>
                    {' · '}
                    {formatDate(entry.created)}
                    {entry.comments ? ` · ${entry.comments}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={!valid || isLoading}>
            {isLoading ? 'Saving…' : 'Save override'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
