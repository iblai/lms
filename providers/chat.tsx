'use client';

import React, { useState } from 'react';
import { ChatContext } from '@/components/chat-button';

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [courseMentor, setCourseMentor] = useState<string | null>(null);
  const [mentorSidebarHidden, setMentorSidebarHidden] = useState(false);

  const chatContextValue = {
    isOpen,
    setIsOpen,
    courseMentor,
    setCourseMentor,
    mentorSidebarHidden,
    setMentorSidebarHidden,
  };

  return <ChatContext.Provider value={chatContextValue}>{children}</ChatContext.Provider>;
};
