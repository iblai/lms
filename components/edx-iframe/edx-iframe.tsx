import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useContext, useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import isEmpty from 'lodash/isEmpty';
import { useEdxIframe } from '@/hooks/courses/use-edx-iframe';
import { Loader2 } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import useCourseNavigator from '@/hooks/courses/useCourseNavigator';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
// @ts-ignore
import { useLazyGetExamInfoQuery } from '@iblai/iblai-js/data-layer';
import { LOCALSTORAGE_KEYS } from '@/constants/storage';
import { markEdxIframeLoaded, markEdxIframeUnloaded } from '@/hooks/courses/use-edx-iframe-loaded';
import { cn } from '@/lib/utils';

// Only mounted inside a timed/special-exam subsection (examInfo set); defer its chunk.
const TimedExam = dynamic(() => import('./timed-exam').then((m) => m.TimedExam), { ssr: false });

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
    agentMode,
    agentFullscreen,
    disableUnitAutoCompletion,
  } = useContext(EdxIframeContext);
  const isAssessmentMode = agentMode === 'assessment';
  const isAssessmentFullscreen = isAssessmentMode && agentFullscreen;
  const { currentUnitID, refetchCourseOutline } = useContext(CourseOutlineContext);

  const searchParams = useSearchParams();
  const [fetchingIframeData, setFetchingIframeData] = useState(true);
  const { getIframeURL, findSequentialParent } = useEdxIframe();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { navigator } = useCourseNavigator(courseOutline, currentUnitID || courseID);

  const [getExamInfo] = useLazyGetExamInfoQuery();

  const handleLoadCourse = useDebouncedCallback(() => {
    if (!isEmpty(courseOutline)) {
      setExamInfo(null);
      setCurrentlyInExamSubsection(false);
      setFetchingIframeData(true);
      if (activeTab === 'course' || activeTab === 'agent') {
        getIframeURL(courseID, courseOutline, async (url) => {
          try {
            const courseOutlineData = Array.isArray(courseOutline?.children)
              ? courseOutline.children[
                  navigator?.thirdLevelChildren[navigator?.currentIndex]?.chapterIndex
                ]
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
            console.error('Failed to fetch exam info for subsection:', error);
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

  // The MFE only honours the auto-completion config once it has loaded, so the
  // send is gated on the load event and re-runs whenever the flag or the loaded
  // document changes (settings can flip without a reload).
  const [iframeLoaded, setIframeLoaded] = useState(false);
  useEffect(() => {
    setIframeLoaded(false);
    markEdxIframeUnloaded();
  }, [iframeUrl]);

  // The agent decides when a unit is complete (see `useUnitAutoCompletion`,
  // which resolves this flag), so tell the edX MFE to stop auto-completing
  // units on view.
  const sendUnitAutoCompletionConfig = useCallback(() => {
    if (!disableUnitAutoCompletion) return;
    if (!iframeLoaded || !iframeRef.current || !iframeUrl) return;
    //TODO comment out console
    console.log(
      'sendUnitAutoCompletionConfig: ',
      disableUnitAutoCompletion,
      activeTab,
      iframeLoaded,
      iframeUrl,
    );
    try {
      const iframeOrigin = new URL(iframeUrl).origin;
      iframeRef.current.contentWindow?.postMessage(
        { type: 'unit.completion.config', disable_unit_auto_completion: true },
        iframeOrigin,
      );
    } catch (error) {
      console.error('[Unit Completion PostMessage] Failed to send config:', {
        error: error instanceof Error ? error.message : String(error),
        iframeUrl,
      });
    }
  }, [disableUnitAutoCompletion, iframeLoaded, iframeUrl]);

  useEffect(() => {
    sendUnitAutoCompletionConfig();
  }, [sendUnitAutoCompletionConfig]);

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
  }, [courseOutline?.id, searchParams, courseID, activeTab, refresher]);
  return (
    <>
      {fetchingIframeData ? (
        <div className="relative inset-0 z-50 flex h-full items-center justify-center bg-white">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : (
        <div
          className={cn(
            'w-full',
            isAssessmentMode ? 'p-0' : 'p-6',
            isAssessmentFullscreen && 'h-full',
            `active-tab-${activeTab} course-edx-iframe-container`,
          )}
        >
          {examInfo && <TimedExam />}
          {(!examInfo || (examInfo?.exam && !isEmpty(examInfo?.exam?.attempt))) && (
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              onLoad={() => {
                setFetchingIframeData(false);
                setIframeLoaded(true);
                refetchCourseOutline(false);
                // The agent tab keeps this iframe hidden, and defers both the
                // mentor's mount and its unit notifications until the iframe
                // has actually loaded.
                markEdxIframeLoaded();
              }}
              id="edx-iframe"
              title="Forum InnerWare"
              sandbox="allow-modals allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-downloads"
              frameBorder={0}
              className={
                isAssessmentFullscreen
                  ? 'h-full w-full'
                  : isAssessmentMode
                    ? 'h-[calc(100vh-255px)] w-full md:h-[calc(100vh-257px)] lg:h-[calc(100vh-247px)]'
                    : undefined
              }
              style={
                isAssessmentFullscreen
                  ? { width: '100%', height: '100%' }
                  : isAssessmentMode
                    ? { width: '100%' }
                    : { width: '100%', height: 'calc(100vh - 100px - 62px)' }
              }
              allowFullScreen={true}
              allow="microphone *; camera *; midi *; geolocation *; encrypted-media *"
            />
          )}
        </div>
      )}
    </>
  );
};
