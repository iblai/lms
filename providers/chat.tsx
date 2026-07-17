'use client';

import React, { useMemo, useState } from 'react';
import { ChatContext } from '@/components/chat-button';

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [courseMentor, setCourseMentor] = useState<string | null>(null);
  const [mentorSidebarHidden, setMentorSidebarHidden] = useState(false);

  const chatContextValue = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      courseMentor,
      setCourseMentor,
      mentorSidebarHidden,
      setMentorSidebarHidden,
    }),
    [isOpen, courseMentor, mentorSidebarHidden],
  );

  return <ChatContext.Provider value={chatContextValue}>{children}</ChatContext.Provider>;
};
