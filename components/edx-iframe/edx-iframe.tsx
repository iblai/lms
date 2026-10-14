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
import {
  EDX_IFRAME_ID,
  EDX_UNIT_LOADED_GRACE_MS,
  getLoadedEdxUnitId,
  isEdxUnitLoadedMessage,
  markEdxIframeLoaded,
  markEdxIframeUnloaded,
  markEdxUnitLoaded,
} from '@/hooks/courses/use-edx-iframe-loaded';
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
  const { getIframeURL, getUnitToIframe, findSequentialParent } = useEdxIframe();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // The unit this iframe was mounted for, so the element's load event can stand
  // in for a `unit.loaded` frame the edX page never sends.
  const loadingUnitIdRef = useRef<string | null>(null);
  const unitLoadedGraceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelUnitLoadedGrace = useCallback(() => {
    if (unitLoadedGraceRef.current) clearTimeout(unitLoadedGraceRef.current);
    unitLoadedGraceRef.current = null;
  }, []);
  const { navigator } = useCourseNavigator(courseOutline, currentUnitID || courseID);

  const [getExamInfo] = useLazyGetExamInfoQuery();

  const handleLoadCourse = useDebouncedCallback(() => {
    if (!isEmpty(courseOutline)) {
      setExamInfo(null);
      setCurrentlyInExamSubsection(false);
      setFetchingIframeData(true);
      // The iframe is torn down here, not when the URL lands after the SSO
      // round-trip, so nothing reads a stale loaded state in between.
      cancelUnitLoadedGrace();
      markEdxIframeUnloaded();
      if (activeTab === 'course' || activeTab === 'agent') {
        loadingUnitIdRef.current = getUnitToIframe(courseOutline)?.id ?? null;
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
        loadingUnitIdRef.current = null;
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
  }, [iframeUrl]);

  useEffect(
    () => () => {
      cancelUnitLoadedGrace();
      markEdxIframeUnloaded();
    },
    [cancelUnitLoadedGrace],
  );

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

      if (isEdxUnitLoadedMessage(event.data)) {
        // Only the course iframe's own window may announce its unit.
        if (event.source !== iframeRef.current?.contentWindow) return;
        cancelUnitLoadedGrace();
        markEdxUnitLoaded(event.data.usageId);
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
          currentActiveTab === 'gradebook' ||
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
  }, [cancelUnitLoadedGrace]); // Stable deps - listener never recreated, reads from refs

  useEffect(() => {
    handleLoadCourse();
  }, [courseOutline?.id, searchParams, courseID, activeTab, refresher]);

  // The mentor's unit notifications wait on the edX page's own `unit.loaded`
  // frame, posted right after its load event. Deployments without that script
  // never send one, so the element's load event stands in after a short grace,
  // tagged with the unit this iframe was mounted for.
  const scheduleUnitLoadedFallback = () => {
    const unitId = loadingUnitIdRef.current;
    if (!unitId || getLoadedEdxUnitId() === unitId) return;
    cancelUnitLoadedGrace();
    unitLoadedGraceRef.current = setTimeout(() => {
      unitLoadedGraceRef.current = null;
      if (getLoadedEdxUnitId() !== unitId) markEdxUnitLoaded(unitId);
    }, EDX_UNIT_LOADED_GRACE_MS);
  };
  return (
    <>
      {fetchingIframeData ? (
        <div className="relative inset-0 z-50 flex min-h-0 flex-1 items-center justify-center bg-white">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : (
        // Flex column filling whatever the layout hands it, so the iframe ends
        // exactly at the footer instead of guessing the header height.
        <div
          className={cn(
            'flex min-h-0 w-full flex-1 flex-col',
            // Horizontal padding mirrors the course header so the iframe lines
            // up with the tab track and the Manage button.
            isAssessmentMode ? 'p-0' : 'px-3 py-4 md:px-4',
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
                // The agent tab keeps this iframe hidden and defers the mentor's
                // mount until the iframe has actually loaded.
                markEdxIframeLoaded();
                scheduleUnitLoadedFallback();
              }}
              id={EDX_IFRAME_ID}
              title="Forum InnerWare"
              sandbox="allow-modals allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-downloads"
              frameBorder={0}
              className={isAssessmentFullscreen ? 'h-full w-full' : 'min-h-0 w-full flex-1'}
              style={isAssessmentFullscreen ? { width: '100%', height: '100%' } : { width: '100%' }}
              allowFullScreen={true}
              allow="microphone *; camera *; midi *; geolocation *; encrypted-media *"
            />
          )}
        </div>
      )}
    </>
  );
};
