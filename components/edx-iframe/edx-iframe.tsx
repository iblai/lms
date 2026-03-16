import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useContext, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import _ from 'lodash';
import { useEdxIframe } from '@/hooks/courses/use-edx-iframe';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import useCourseNavigator from '@/hooks/courses/useCourseNavigator';
import { CourseOutlineChildNode } from '@/types/courses';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
// @ts-ignore
import { useLazyGetExamInfoQuery } from '@iblai/iblai-js/data-layer';
import { TimedExam } from './timed-exam';
import { LOCALSTORAGE_KEYS } from '@/constants/storage';
import { cn } from '@/lib/utils';

export const EdxIframe = () => {
  const {
    courseOutline,
    activeTab,
    courseID,
    setCurrentlyInExamSubsection,
    setExamInfo,
    examInfo,
    iframeUrl,
    setIframeUrl,
    refresher,
  } = useContext(EdxIframeContext);
  const { selectLesson, currentUnitID } = useContext(CourseOutlineContext);

  const searchParams = useSearchParams();
  const [fetchingIframeData, setFetchingIframeData] = useState(true);
  const { getIframeURL, findSequentialParent } = useEdxIframe();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { navigator } = useCourseNavigator(
    { children: courseOutline } as CourseOutlineChildNode,
    currentUnitID || courseID,
  );

  const [getExamInfo] = useLazyGetExamInfoQuery();

  const handleLoadCourse = useDebouncedCallback(() => {
    if (!_.isEmpty(courseOutline)) {
      setExamInfo(null);
      setCurrentlyInExamSubsection(false);
      setFetchingIframeData(true);
      if (activeTab === 'course') {
        getIframeURL(courseID, { children: courseOutline }, async (url) => {
          try {
            const courseOutlineData = Array.isArray(courseOutline)
              ? courseOutline[navigator?.thirdLevelChildren[navigator?.currentIndex]?.chapterIndex]
              : courseOutline;
            const sequentialParentID = findSequentialParent(
              courseOutlineData,
              currentUnitID || courseID,
            );
            const sequentialParent = courseOutlineData?.children?.find(
              (block) => block.id === sequentialParentID,
            );
            setCurrentlyInExamSubsection(sequentialParent?.special_exam_info || false);
            if (sequentialParent?.special_exam_info) {
              const _examInfo = await getExamInfo(
                {
                  course_id: courseID,
                  content_id: sequentialParent.id,
                  is_learning_mfe: true,
                },
                false,
              );
              setExamInfo(_examInfo?.data || null);
            }
          } catch (error) {
            console.error(JSON.stringify(error));
            setCurrentlyInExamSubsection(false);
          }
          //setIsExamSubsection(url.includes('exam'));
          setIframeUrl(url);
          setFetchingIframeData(false);
        });
      } else {
        getIframeURL(courseID, activeTab, (url) => {
          setIframeUrl(url);
          setFetchingIframeData(false);
        });
      }
    }
  }, 300);

  const navigateEdxURL = (unitID: string) => {
    selectLesson(unitID);
  };

  const handlePreviousBtnClick = () => {
    const target = navigator.moveToPrevious();
    if (!target) {
      return;
    }
    setTimeout(() => {
      navigateEdxURL(target.id);
    }, 100);
  };

  const handleNextBtnClick = () => {
    const target = navigator.moveToNext();
    if (!target) {
      return;
    }
    setTimeout(() => {
      navigateEdxURL(target.id);
    }, 100);
  };

  // Store iframeUrl in a ref so we can access it in the message handler
  const iframeUrlRef = useRef(iframeUrl);
  useEffect(() => {
    iframeUrlRef.current = iframeUrl;
  }, [iframeUrl]);

  // Store activeTab in a ref so we can access it in the message handler
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Listen for ready message from MFE - set up once and always active
  // Accept messages from any origin, then validate inside the handler
  // This listener is stable and doesn't depend on changing values
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Type guard for message data
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      // Check if this is a ready message from the MFE
      if (event.data?.type === 'auth.jwt.ready') {
        const currentIframeUrl = iframeUrlRef.current;
        const currentActiveTab = activeTabRef.current;

        if (currentIframeUrl) {
          try {
            const iframeOrigin = new URL(currentIframeUrl).origin;
            if (event.origin !== iframeOrigin) {
              console.error('[JWT PostMessage] Origin mismatch - rejecting message', {
                expected: iframeOrigin,
                received: event.origin,
              });
              return;
            }
          } catch (error) {
            console.error('[JWT PostMessage] Failed to validate origin:', {
              error: error instanceof Error ? error.message : String(error),
              iframeUrl: currentIframeUrl,
            });
            return;
          }
        }

        // Send JWT token now that MFE is ready - inline to avoid dependency
        const isMFETab =
          currentActiveTab === 'progress' ||
          currentActiveTab === 'dates' ||
          currentActiveTab === 'forum';
        if (!isMFETab || !iframeRef.current || !currentIframeUrl) return;

        try {
          const jwtToken = localStorage.getItem(LOCALSTORAGE_KEYS.EDX_TOKEN_KEY);
          if (!jwtToken) return;

          const iframeOrigin = new URL(currentIframeUrl).origin;
          const message = { type: 'auth.jwt.token', edx_jwt_token: jwtToken };
          iframeRef.current.contentWindow?.postMessage(message, iframeOrigin);
        } catch (error) {
          console.error('[JWT PostMessage] Failed to send token in response to ready message:', {
            error: error instanceof Error ? error.message : String(error),
            iframeUrl: currentIframeUrl,
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // Empty deps - listener never recreated, reads from refs

  useEffect(() => {
    handleLoadCourse();
  }, [courseOutline, searchParams, courseID, activeTab, refresher]);
  return (
    <>
      {fetchingIframeData ? (
        <div className="relative inset-0 flex justify-center items-center bg-white z-50 h-full">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      ) : (
        <div className={cn('w-full p-6', `active-tab-${activeTab} course-edx-iframe-container`)} >
          {examInfo && <TimedExam />}
          {(!examInfo || (examInfo?.exam && !_.isEmpty(examInfo?.exam?.attempt))) && (
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              onLoad={() => {
                setFetchingIframeData(false);
                setIframeLoaded(true);
              }}
              id="edx-iframe"
              title="Forum InnerWare"
              sandbox="allow-modals allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-downloads"
              frameBorder={0}
              style={{ width: '100%', height: 'calc(100vh - 100px - 62px)' }}
              allowFullScreen={true}
              allow="microphone *; camera *; midi *; geolocation *; encrypted-media *"
            />
          )}
          {iframeLoaded && activeTab === 'course' &&
            !fetchingIframeData &&
            (!navigator.isPreviousHidden() || !navigator.isNextHidden()) && (
              <div
                className={`flex ${
                  navigator.isPreviousHidden() ? 'justify-end' : 'justify-between'
                } items-center mt-4`}
              >
                {!navigator.isPreviousHidden() && (
                  <button
                    onClick={handlePreviousBtnClick}
                    className="rounded-sm px-4 py-2 border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center"
                  >
                    <ChevronRight className="h-4 w-4 transform rotate-180 mr-1" />
                    Previous Lesson
                  </button>
                )}
                {!navigator.isNextHidden() && (
                  <button
                    onClick={handleNextBtnClick}
                    className="rounded-sm bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-sm font-medium text-[var(--button-primary-text)] flex items-center hover:opacity-[var(--button-primary-hover-opacity)]"
                  >
                    Next Lesson
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                )}
              </div>
            )}
        </div>
      )}
    </>
  );
};
