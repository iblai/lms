'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { createContext, useContext } from 'react';
import { config } from '@/lib/config';
import '@iblai/agent-ai';
import React from 'react';
import { toast } from 'sonner';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useDefaultMentor } from '@/hooks/use-default-mentor';

// Create a context to share the chat state with other components
export const ChatContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  courseMentor: string | null;
  setCourseMentor: (mentor: string | null) => void;
  mentorSidebarHidden: boolean;
  setMentorSidebarHidden: (hidden: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
  courseMentor: null,
  setCourseMentor: () => {},
  mentorSidebarHidden: false,
  setMentorSidebarHidden: () => {},
});

export const useChatState = () => useContext(ChatContext);

interface ChatButtonProps {
  isMobile?: boolean;
}

export function ChatButton({ isMobile = false }: ChatButtonProps) {
  const tenant = useTenantParam();
  const { isOpen, setIsOpen, courseMentor, mentorSidebarHidden } = useChatState();
  const [alreadyOpened, setAlreadyOpened] = useState(false);

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setAlreadyOpened(true);
    }
  };

  // Mentor resolution (course → embedded → recent → featured) lives in the hook
  // so the onboarding wizard embeds the same agent this launcher opens.
  const { mentor: mentorInUse, isLoading: isMentorLoading } = useDefaultMentor({
    tenant,
    courseMentor,
    skip: mentorSidebarHidden,
    onError: () => {
      handleOpen(false);
      toast.error('No mentors found');
    },
  });

  useEffect(() => {
    if (mentorSidebarHidden) {
      handleOpen(false);
    }
  }, [mentorSidebarHidden]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if the message contains the expected close format
      if (event.data && typeof event.data === 'object') {
        if (event.data.closeEmbed === true && event.data.collapseSidebarCopilot === true) {
          handleOpen(false);
        }
      }
    };

    // Add event listener for postMessage
    window.addEventListener('message', handleMessage);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  if (isMentorLoading) {
    return (
      <div className="relative flex h-24 w-[45px] items-center justify-center rounded-sm bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all hover:shadow-[0_0_15px_rgba(0,0,0,0.2)]">
        <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isMentorLoading && !mentorInUse && mentorSidebarHidden) {
    return <></>;
  }

  if (isMobile) {
    // Mobile version - fixed at bottom
    return (
      <div className="w-full px-4 pb-4">
        {alreadyOpened && mentorInUse && (
          <div
            className={`fixed inset-0 z-50 flex flex-col bg-white ${isOpen ? 'flex' : 'hidden'}`}
          >
            <div className="relative flex h-full items-center justify-between">
              {/* <button
                onClick={() => handleOpen(false)}
                className={`fixed transform-rotate-90 left-[50%] top-[-30px] border-radius-[5px 0 0 5px] z-[2147483647] flex h-[85px] w-[25px] items-center justify-center rounded-sm bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all hover:shadow-[0_0_15px_rgba(0,0,0,0.2)]`}
                aria-label="Close chat assistant"
                style={{
                  transform: "rotate(90deg)",
                }}
              >
                <ArrowRight className="h-4 w-4" />
              </button> */}
              {React.createElement('agent-ai', {
                mentorUrl: config.urls.mentor(),
                authUrl: config.urls.auth(),
                lmsUrl: config.urls.lms(),
                tenant: tenant,
                mentor: mentorInUse,
                contextOrigins: `${config.urls.lms()}`,
                authRelyOnHost: true,
                isContextAware: true,
                theme: 'light',
                style: {
                  height: '100%',
                  width: '100%',
                },
              })}
            </div>
          </div>
        )}
        {!isOpen && (
          <button
            onClick={() => handleOpen(true)}
            className="fixed right-6 bottom-20 z-20 flex h-14 w-14 items-center justify-center rounded-sm bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] hover:shadow-[0_0_15px_rgba(0,0,0,0.2)]"
          >
            <Image
              src="/images/mentor-loader.png"
              alt="Chat assistant"
              width={32}
              height={32}
              className="h-8 w-8"
            />
          </button>
        )}
      </div>
    );
  }

  // Desktop version - now part of the row layout, not fixed
  return (
    <div className="relative z-[9] h-full pt-4 pr-0 pb-30 pl-4">
      <button
        onClick={() => handleOpen(!isOpen)}
        className={`relative flex h-24 w-[45px] items-center justify-center rounded-sm bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all hover:shadow-[0_0_15px_rgba(0,0,0,0.2)] ${
          isOpen ? 'hidden' : 'block'
        }`}
        aria-label="Open chat assistant"
      >
        <Image
          src="/images/mentor-loader.png"
          alt="Chat assistant"
          width={28}
          height={28}
          className="h-7 w-7"
        />
      </button>

      {alreadyOpened && mentorInUse && (
        <div
          className={`z-20 mr-4 flex h-[calc(100vh-120px)] w-[360px] flex-col overflow-hidden rounded-sm bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] ${
            isOpen ? 'flex' : 'hidden'
          }`}
        >
          <div className="flex h-full items-center justify-between">
            {/* <button
              onClick={() => handleOpen(false)}
              className="absolute top-1 right-1 z-10 border border-gray-200 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 bg-white shadow-sm"
            >
              <X className="h-5 w-5" />
            </button> */}
            {React.createElement('agent-ai', {
              mentorUrl: config.urls.mentor(),
              authUrl: config.urls.auth(),
              lmsUrl: config.urls.lms(),
              tenant: tenant,
              mentor: mentorInUse,
              contextOrigins: `${config.urls.lms()}`,
              authRelyOnHost: true,
              isContextAware: true,
              theme: 'light',
              style: {
                height: '100%',
                width: '100%',
              },
            })}
          </div>
        </div>
      )}
    </div>
  );
}
