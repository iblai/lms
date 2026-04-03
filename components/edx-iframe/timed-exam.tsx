import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useContext, useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import _ from 'lodash';
import {
  // @ts-ignore
  useUpdateExamAttemptMutation,
  // @ts-ignore
  useStartExamMutation,
  // @ts-ignore
  useLazyGetExamInfoQuery,
} from '@iblai/iblai-js/data-layer';

export const TimedExam = () => {
  const { examInfo, setExamInfo, setRefresher } = useContext(EdxIframeContext);
  const [isReadyToStart, setIsReadyToStart] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showFullInstructions, setShowFullInstructions] = useState(false);
  const [showEndExamModal, setShowEndExamModal] = useState(false);

  const [updateExamAttempt, { isLoading: isSubmittingExam }] = useUpdateExamAttemptMutation();
  const [startExam, { isLoading: isStartingExam }] = useStartExamMutation();
  const [getExamInfo] = useLazyGetExamInfoQuery();

  // Initialize timer when exam is started
  useEffect(() => {
    if (
      examInfo?.exam?.attempt?.attempt_status === 'started' &&
      examInfo?.exam?.attempt?.time_remaining_seconds
    ) {
      setTimeRemaining(Math.floor(examInfo.exam.attempt.time_remaining_seconds));
    }
  }, [examInfo]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0 && examInfo?.exam?.attempt?.attempt_status === 'started') {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev > 0 ? prev - 1 : 0;

          // Auto-submit when timer reaches zero
          if (newTime === 0 && examInfo?.exam?.id) {
            updateExamAttempt({
              attemptID: examInfo.exam.attempt.attempt_id,
              action: 'submit',
            })
              .unwrap()
              .then(() => {
                updateExamInfo();
                setRefresher(new Date());
              })
              .catch((error: any) => {
                console.error('Failed to auto-submit exam:', error);
              });
          }

          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [
    timeRemaining,
    examInfo?.exam?.attempt?.attempt_status,
    examInfo?.exam?.attempt?.attempt_id,
    updateExamAttempt,
  ]);

  if (!examInfo) {
    return null;
  }

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const { exam } = examInfo;
  const timeLimitHours = Math.floor(exam.time_limit_mins / 60);
  const timeLimitMinutes = exam.time_limit_mins % 60;

  const formatTimeLimit = () => {
    if (timeLimitHours > 0 && timeLimitMinutes > 0) {
      return `${timeLimitHours} hour${timeLimitHours > 1 ? 's' : ''} ${timeLimitMinutes} minute${timeLimitMinutes > 1 ? 's' : ''}`;
    } else if (timeLimitHours > 0) {
      return `${timeLimitHours} hour${timeLimitHours > 1 ? 's' : ''}`;
    } else {
      return `${timeLimitMinutes} minute${timeLimitMinutes > 1 ? 's' : ''}`;
    }
  };

  const updateExamInfo = async () => {
    const updatedExamInfo = await getExamInfo(
      {
        course_id: examInfo.exam.course_id,
        content_id: examInfo.exam.content_id,
        is_learning_mfe: true,
      },
      false,
    );
    setExamInfo(updatedExamInfo?.data || null);
  };

  const handleStartExam = async () => {
    try {
      setIsReadyToStart(true);

      if (examInfo?.exam?.id) {
        const formData = new FormData();
        formData.append('exam_id', examInfo.exam.id.toString());
        formData.append('start_clock', 'true');
        await startExam(formData).unwrap();
        await updateExamInfo();
        console.log('Exam started successfully');
        // Optionally refresh exam info to get the updated attempt data
      }
    } catch (error) {
      console.error('Failed to start exam:', error);
      setIsReadyToStart(false); // Reset the state if starting fails
      // Handle error - maybe show an error message to user
    }
  };

  const handleEndExam = () => {
    setShowEndExamModal(true);
  };

  const handleConfirmEndExam = async () => {
    try {
      if (examInfo?.exam?.id) {
        await updateExamAttempt({
          attemptID: examInfo.exam.attempt.attempt_id,
          action: 'submit',
        }).unwrap();

        console.log('Exam submitted successfully');
        setShowEndExamModal(false);
        await updateExamInfo();
        setRefresher(new Date());
        // Optionally refresh exam info or redirect user
      }
    } catch (error) {
      console.error('Failed to submit exam:', error);
      // Handle error - maybe show an error message to user
    }
  };

  const handleCancelEndExam = () => {
    setShowEndExamModal(false);
  };

  // Show timer UI when exam is started
  if (examInfo?.exam?.attempt?.attempt_status === 'started') {
    const isLowTime = timeRemaining <= (examInfo.exam.attempt.low_threshold_sec || 14400);
    const isCriticalTime =
      timeRemaining <= (examInfo.exam.attempt.critically_low_threshold_sec || 3600);

    return (
      <div className="mx-auto max-w-4xl px-6 pt-6">
        <div
          className={`rounded-lg border p-4 ${
            isCriticalTime
              ? 'border-red-200 bg-red-50'
              : isLowTime
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-blue-200 bg-blue-50'
          }`}
        >
          <div className="mb-4 text-sm text-gray-600">
            {showFullInstructions ? (
              <>
                You are taking "{examInfo.exam.exam_name}" as a timed exam. The timer below shows
                the time remaining in the exam. To receive credit for problems, you must select
                "Submit" for each problem before you select "End My Exam".{' '}
                <button
                  className="text-blue-600 underline hover:text-blue-800"
                  onClick={() => setShowFullInstructions(false)}
                >
                  Show less
                </button>
              </>
            ) : (
              <>
                You are taking "{examInfo.exam.exam_name}" as a timed exam.{' '}
                <button
                  className="text-blue-600 underline hover:text-blue-800"
                  onClick={() => setShowFullInstructions(true)}
                >
                  Show more
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock
                className={`h-5 w-5 ${
                  isCriticalTime ? 'text-red-600' : isLowTime ? 'text-yellow-600' : 'text-blue-600'
                }`}
              />
              <span
                className={`text-md font-mono font-semibold ${
                  isCriticalTime ? 'text-red-700' : isLowTime ? 'text-yellow-700' : 'text-blue-700'
                }`}
                aria-live="polite"
                aria-label={`Time remaining: ${formatTimeRemaining(timeRemaining)}`}
              >
                {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
            <button
              onClick={handleEndExam}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              aria-describedby="end-exam-warning"
            >
              End My Exam
            </button>
            <div id="end-exam-warning" className="sr-only">
              Warning: Ending the exam will submit all your answers and you cannot return to
              continue.
            </div>
          </div>
        </div>

        {/* End Exam Confirmation Modal */}
        {showEndExamModal && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="mx-4 w-full max-w-full rounded-lg bg-white p-6 shadow-xl md:max-w-[40%]">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Are you sure that you want to submit your timed exam?
              </h2>

              <p className="mb-3 text-gray-700">
                Make sure that you have selected "Submit" for each problem before you submit your
                exam.
              </p>

              <p className="mb-6 text-gray-700">
                After you submit your exam, your exam will be graded.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmEndExam}
                  disabled={isSubmittingExam}
                  className="rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmittingExam ? 'Submitting...' : 'Yes, submit my timed exam.'}
                </button>
                <button
                  onClick={handleCancelEndExam}
                  className="rounded px-4 py-2 font-medium text-blue-600 transition-colors hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  No, I want to continue working.
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (examInfo?.exam?.attempt?.attempt_status === 'submitted') {
    return null;
  }

  // Show "ready to start" UI when no active attempt exists
  if (_.isEmpty(examInfo?.exam?.attempt) || _.isEmpty(examInfo?.active_attempt)) {
    return (
      <div className="sm:p-6">
        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start gap-3">
            <Clock className="mt-1 h-6 w-6 flex-shrink-0 text-blue-600" />
            <div className="flex-1">
              <h2 className="mb-3 text-xl font-semibold text-gray-900">
                {examInfo.exam.exam_name} is a Timed Exam ({formatTimeLimit()})
              </h2>
              <p className="mb-4 leading-relaxed text-gray-700">
                This exam has a time limit associated with it. To pass this exam, you must complete
                the problems in the time allowed. After you select I am ready to start this timed
                exam, you will have {formatTimeLimit()} to complete and submit the exam.
              </p>
              <button
                onClick={handleStartExam}
                disabled={isStartingExam || isReadyToStart}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-describedby="exam-time-info"
              >
                <Clock className="hidden h-4 w-4 md:block" />
                {isStartingExam ? 'Starting exam...' : 'I am ready to start this timed exam.'}
              </button>
              <div id="exam-time-info" className="sr-only">
                Starting this exam will begin a {formatTimeLimit()} timer that cannot be paused.
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Can I request additional time to complete my exam?
          </h3>
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
            <p className="leading-relaxed text-gray-700">
              If you have disabilities, you might be eligible for an additional time allowance on
              timed exams. Ask your course team for information about additional time allowances.
            </p>
          </div>
        </div>
      </div>
    );
  }
};
