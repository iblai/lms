'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import useCourseNavigator from '@/hooks/courses/useCourseNavigator';
import { config } from '@/lib/config';

/**
 * The `lesson.completed` frame the mentor relays out of its iframe once the
 * agent has marked an edX block complete. Forwarded verbatim from the chat
 * WebSocket, so only the fields this dialog reads are typed here.
 */
export interface LessonCompletedMessage {
  type: 'lesson.completed';
  course_id?: string;
  usage_id?: string;
  completion?: number;
  display_name?: string;
}

export const LESSON_COMPLETED_MESSAGE_TYPE = 'lesson.completed';

/**
 * How long the completed lesson stays on screen before the dialog opens. The
 * agent announces the completion in its own words first, so interrupting the
 * learner the same instant reads as the dialog talking over it.
 */
export const LESSON_COMPLETED_DIALOG_DELAY_MS = 2000;

/**
 * Watches for the mentor's `lesson.completed` postMessage, refreshes the course
 * outline so the sidebar shows the new completion, and offers to move on.
 *
 * Rendered inside both course contexts — it needs the outline (for next/previous
 * availability), `selectLesson` to navigate, and `refetchCourseOutline`.
 */
export function LessonCompletedDialog() {
  const { selectLesson, currentUnitID, refetchCourseOutline } = useContext(CourseOutlineContext);
  const { courseOutline, courseID } = useContext(EdxIframeContext);
  const [completedLesson, setCompletedLesson] = useState<LessonCompletedMessage | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingOpen = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  };

  // Unmount-only, so a new `refetchCourseOutline` identity re-subscribing the
  // listener below never cancels an open the learner is already waiting on.
  useEffect(() => cancelPendingOpen, []);

  const hasOutline = !_.isEmpty(courseOutline) && !!courseID;
  // A fresh navigator per render, positioned on the current unit — the same
  // pattern CourseLessonNavigator uses. `moveToNext`/`moveToPrevious` mutate it,
  // so it must not be shared with another consumer.
  const { navigator } = useCourseNavigator(
    hasOutline ? courseOutline : ({ children: [] } as any),
    currentUnitID || courseID || '',
  );

  const hasPrevious = hasOutline && !navigator.isPreviousHidden();
  const hasNext = hasOutline && !navigator.isNextHidden();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // The mentor SPA is the only origin allowed to declare a lesson complete;
      // acting on any frame would let an arbitrary embed navigate the learner.
      if (event.origin !== new URL(config.urls.mentor()).origin) return;

      const message = event.data;
      if (!message || typeof message !== 'object') return;
      if (message.type !== LESSON_COMPLETED_MESSAGE_TYPE) return;
      // The mentor already filters partials, but this is the gate that decides
      // whether a learner is interrupted — re-check rather than trust it.
      if (message.completion !== 1) return;

      // Held back by `LESSON_COMPLETED_DIALOG_DELAY_MS`; a second completion
      // arriving inside that window supersedes the one still waiting.
      cancelPendingOpen();
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        setCompletedLesson(message as LessonCompletedMessage);
      }, LESSON_COMPLETED_DIALOG_DELAY_MS);
      // The sidebar's completion ticks come from the outline, so pull it fresh.
      // `false` keeps the loading state off: swapping the outline out for a
      // spinner behind the dialog would flash the whole page.
      refetchCourseOutline(false);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetchCourseOutline]);

  const close = () => {
    cancelPendingOpen();
    setCompletedLesson(null);
  };

  const goToPrevious = () => {
    const target = navigator.moveToPrevious();
    close();
    if (target) selectLesson(target.id);
  };

  const goToNext = () => {
    const target = navigator.moveToNext();
    close();
    if (target) selectLesson(target.id);
  };

  return (
    <Dialog open={!!completedLesson} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
            Lesson complete
          </DialogTitle>
          <DialogDescription>
            {completedLesson?.display_name
              ? `You've completed "${completedLesson.display_name}". Ready to keep learning?`
              : "You've completed this lesson. Ready to keep learning?"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={close}>
            Stay here
          </Button>
          <div className="flex gap-2">
            {hasPrevious && (
              <Button variant="outline" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
                Previous unit
              </Button>
            )}
            {hasNext && (
              <Button onClick={goToNext}>
                Keep Learning
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
