'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { scrollbarHideStyles } from './utils';

// Import slide components
import WelcomeSlide from './WelcomeSlide';
import RoleSelectionSlide from './RoleSelectionSlide';
import SkillsSlide from './SkillsSlide';
import ProfileSlide from './ProfileSlide';
import FinalSlide from './FinalSlide';
import { useStartPage } from '@/hooks/start/use-start-page';
import { StartPageContext } from '@/hooks/start/start-page-context';
import { toast } from 'sonner';
import { CatalogSearchSkill } from '@/types/skills';
import { Logo } from '../logo';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { getTenant } from '@/utils/helpers';

export default function OnboardingFlow() {
  const { metadata } = useTenantMetadata({
    org: getTenant(),
  });
  const {
    fields,
    setFields,
    handleToggleRole,
    isRoleSelected,
    handleToggleSkill,
    isSkillSelected,
    handleUpdateSkillRating,
    handleProfileImageSelect,
    profileImage,
    handleSocialLinksUpdate,
    handleResumeSelect: handleFileUpload,
    handleSubmit,
  } = useStartPage();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const rolesScreenEnabled = metadata?.enable_roles_screen_on_start_page !== false;
  const skillsScreenEnabled = metadata?.enable_skills_screen_on_start_page !== false;
  const profileScreenEnabled = metadata?.enable_profile_screen_on_start_page !== false;
  const getStartedScreenEnabled = metadata?.enable_get_started_screen_on_start_page !== false;
  const totalSlides =
    (rolesScreenEnabled ? 1 : 0) +
    (skillsScreenEnabled ? 1 : 0) +
    (profileScreenEnabled ? 1 : 0) +
    (getStartedScreenEnabled ? 1 : 0);

  const slides = [
    'WelcomeSlide',
    ...(rolesScreenEnabled ? ['RoleSelectionSlide'] : []),
    ...(skillsScreenEnabled ? ['SkillsSlide'] : []),
    ...(profileScreenEnabled ? ['ProfileSlide'] : []),
    ...(getStartedScreenEnabled ? ['FinalSlide'] : []),
  ];

  const nextSlide = () => {
    /* if (currentSlide === 1 && fields.roles.length === 0) {
      toast.error("Please select at least one role to continue.");
      return;
    } */
    if (currentSlide === slides.indexOf('SkillsSlide')) {
      /* if (fields.skills.length === 0) {
        toast.error("Please select at least one skill to continue.");
        return;
      } */
      if (
        fields.skills.length > 0 &&
        fields.skills.some((skill: CatalogSearchSkill) => skill?.rating === undefined)
      ) {
        toast.error('Please rate all skills to continue.');
        return;
      }
    }
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleGetStarted = () => {
    handleSubmit();
  };

  useEffect(() => {
    return () => {
      // Clean up object URLs when component unmounts
      if (profileImage) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);

  // Add style tag for custom scrollbar styles
  useEffect(() => {
    // Add the style element if it doesn't exist
    if (!document.getElementById('scrollbar-hide-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'scrollbar-hide-styles';
      styleElement.textContent = scrollbarHideStyles;
      document.head.appendChild(styleElement);

      // Clean up on unmount
      return () => {
        const styleEl = document.getElementById('scrollbar-hide-styles');
        if (styleEl) {
          document.head.removeChild(styleEl);
        }
      };
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-amber-50/30 pt-16 pb-20 sm:pt-20">
      {/* Fixed Header */}
      <div className="fixed top-0 right-0 left-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl justify-center py-2 sm:py-4">
          <div className="relative h-8 w-20 sm:h-9 sm:w-24">
            <Logo width={90} height={30} />
          </div>
        </div>
      </div>
      <StartPageContext.Provider
        value={{
          fields,
          setFields,
          handleToggleRole,
          isRoleSelected,
          handleToggleSkill,
          isSkillSelected,
          handleUpdateSkillRating,
          handleProfileImageSelect,
          profileImage,
          handleSocialLinksUpdate,
          handleFileUpload,
        }}
      >
        {/* Main Content */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 md:px-0">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
            <AnimatePresence mode="wait">
              {currentSlide === slides.indexOf('WelcomeSlide') && (
                <WelcomeSlide onNext={nextSlide} onPrev={prevSlide} />
              )}

              {currentSlide === slides.indexOf('RoleSelectionSlide') && <RoleSelectionSlide />}

              {currentSlide === slides.indexOf('SkillsSlide') && <SkillsSlide />}

              {currentSlide === slides.indexOf('ProfileSlide') && (
                <ProfileSlide
                  onNext={nextSlide}
                  onPrev={prevSlide}
                  isDragging={isDragging}
                  setIsDragging={setIsDragging}
                />
              )}

              {currentSlide === slides.indexOf('FinalSlide') && (
                <FinalSlide
                  onNext={nextSlide}
                  onPrev={prevSlide}
                  handleGetStarted={handleGetStarted}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </StartPageContext.Provider>

      {/* Fixed Footer Navigation */}
      <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between p-3 sm:p-4">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`flex items-center gap-1 rounded-lg px-2 py-2 text-xs transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
              currentSlide === 0
                ? 'cursor-not-allowed text-gray-300'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="xs:inline hidden sm:inline">Previous</span>
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalSlides + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 w-2 rounded-full transition-colors sm:h-2.5 sm:w-2.5 ${
                  currentSlide === index ? 'bg-amber-500' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={currentSlide === totalSlides ? handleGetStarted : nextSlide}
            className={`flex items-center gap-1 rounded-lg px-2 py-2 text-xs transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
              currentSlide === totalSlides - 1
                ? 'bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] hover:opacity-[var(--button-primary-hover-opacity)]'
                : 'bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] hover:opacity-[var(--button-primary-hover-opacity)]'
            }`}
          >
            {currentSlide === totalSlides ? (
              'Get Started'
            ) : (
              <>
                <span>Next</span>
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
