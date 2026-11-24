'use client';

import React, { useContext, useEffect } from 'react';
import '@iblai/agent-ai';
import { getUserId } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useCourseAgentBridge } from '@/hooks/courses/use-course-agent-bridge';
import { markUnitRenderedByHost } from '@/hooks/courses/use-edx-iframe-loaded';
import { buildAssessmentMentorProps } from '@/utils/assessment-mentor';
import type { MentorXblockOutlineNode } from '@/types/courses';

interface AssessmentMentorChatProps {
  /** The unit's mentor xblock as the course outline lists it. */
  block: MentorXblockOutlineNode;
}

/**
 * Embeds an assessment unit's mentor straight into the page from the xblock
 * settings the course outline carries, instead of loading the edX unit in an
 * iframe only for its own `<agent-ai>` to load that same mentor.
 */
export function AssessmentMentorChat({ block }: AssessmentMentorChatProps) {
  const tenant = useTenantParam();
  const { courseID } = useContext(EdxIframeContext);
  const { currentUnitID } = useContext(CourseOutlineContext);
  const mentorElementRef = useCourseAgentBridge(block.mentor);

  // No course iframe will announce this unit, so stand in for its
  // `unit.loaded` frame: the layout's unit-switch notice waits on it.
  useEffect(() => {
    if (currentUnitID) markUnitRenderedByHost(currentUnitID);
  }, [currentUnitID]);

  return (
    <div className="relative h-full w-full" data-testid="assessment-mentor-chat">
      {React.createElement('agent-ai', {
        ref: mentorElementRef,
        ...buildAssessmentMentorProps(block, {
          tenant,
          courseId: courseID,
          userId: getUserId(),
        }),
        theme: 'light',
        style: { height: '100%', width: '100%' },
      })}
    </div>
  );
}
