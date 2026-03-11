'use client';

import { useState, useRef } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { AddSkillDialog } from '@/components/add-skill-dialog';
import { SkillDetailModal } from '@/components/skill-detail-modal';
import { useProfileSkills } from '@/hooks/profile/use-profile-skills';
import { SkillBox } from '@/components/skill-box';
import { SkeletonSkillBox } from '@/components/skeleton-skill-box';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import _ from 'lodash';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { UserSkill } from '@/types/skills';

export default function SkillsPage() {
  const {
    earnedSkills,
    earnedSkillsLoading,
    earnedSkillsError,
    earnedSkillsSuccess,
    selfReportedSkills,
    selfReportedSkillsError,
    selfReportedSkillsLoading,
    selfReportedSkillsSuccess,
    desiredSkills,
    desiredSkillsLoading,
    desiredSkillsError,
    desiredSkillsSuccess,
    handleSkillsDeletion,
    updatingSkill,
    deletingSkill,
    handleSkillsUpdate,
  } = useProfileSkills();
  const [searchQuery, setSearchQuery] = useState('');
  const [addSkillDialogOpen, setAddSkillDialogOpen] = useState(false);
  const [skillTypeToAdd, setSkillTypeToAdd] = useState<'earned' | 'desired' | 'self-reported'>(
    'earned',
  );
  const [selectedSkill, setSelectedSkill] = useState<UserSkill | null>(null);

  // Add refs for scroll containers
  const selfReportedScrollRef = useRef<HTMLDivElement | null>(null);
  const desiredSkillsScrollRef = useRef<HTMLDivElement | null>(null);

  // Scroll functions
  const scrollLeft = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleOpenAddSkillDialog = (type: 'earned' | 'desired' | 'self-reported') => {
    setSkillTypeToAdd(type);
    setAddSkillDialogOpen(true);
  };

  return (
    <>
      <div className="p-6 pt-8">
        {/* Search Bar */}
        <div className="relative w-64 mb-6">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Earned Skills Section - Now with a distinct card and background */}
        <div className="mb-8 bg-gray-50 rounded-md p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-700">Earned</h2>
            {/* <button
              onClick={() => handleOpenAddSkillDialog("earned")}
              className="flex items-center gap-1 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] px-3 py-1.5 rounded-md hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Skill</span>
            </button> */}
          </div>

          <div className="flex flex-nowrap overflow-x-auto gap-4">
            {earnedSkillsLoading && (
              <SkeletonMultiplier Skeleton={SkeletonSkillBox} multiplier={6} />
            )}
            {!earnedSkillsLoading && earnedSkillsError && (
              <DefaultEmptyBox className="w-full" message="You don't have any earned skills yet." />
            )}
            {!earnedSkillsLoading && earnedSkillsSuccess && _.isEmpty(earnedSkills) && (
              <DefaultEmptyBox className="w-full" message="You don't have any earned skills yet." />
            )}
            {!earnedSkillsLoading &&
              earnedSkillsSuccess &&
              !_.isEmpty(earnedSkills?.resources) &&
              earnedSkills?.resources.map((skill: any, index: number) => (
                <SkillBox
                  key={index}
                  onSkillClick={() => {}}
                  skill={{
                    name: skill.name || '',
                    level: skill.points || 0,
                    starred: false,
                  }}
                />
              ))}
          </div>
        </div>

        {/* Self-Reported Skills Section - Now with a distinct card and background */}
        <div className="mb-8 bg-amber-50/30 rounded-md p-4 sm:p-6 border border-amber-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-lg font-medium text-gray-700">Self-Reported</h2>
            <div className="flex gap-2 sm:gap-4">
              <div className="sm:hidden flex gap-2 order-2 sm:order-1">
                <button
                  onClick={() =>
                    scrollLeft(selfReportedScrollRef as React.RefObject<HTMLDivElement>)
                  }
                  className="w-8 h-8 flex items-center justify-center bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                  aria-label="Previous skills"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    scrollRight(selfReportedScrollRef as React.RefObject<HTMLDivElement>)
                  }
                  className="w-8 h-8 flex items-center justify-center bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                  aria-label="Next skills"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={() => handleOpenAddSkillDialog('self-reported')}
                className="flex items-center gap-1 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] px-3 py-1.5 rounded-md hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity order-1 sm:order-2 flex-1 sm:flex-initial justify-center sm:justify-start"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add Skill</span>
              </button>
            </div>
          </div>

          {/* Mobile view - horizontal scrolling container */}
          <div ref={selfReportedScrollRef} className="sm:hidden overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {selfReportedSkillsLoading && (
                <SkeletonMultiplier Skeleton={SkeletonSkillBox} multiplier={6} />
              )}
              {!selfReportedSkillsLoading && selfReportedSkillsError && (
                <DefaultEmptyBox
                  className="w-full"
                  message="You don't have any self-reported skills yet."
                />
              )}
              {!selfReportedSkillsLoading &&
                selfReportedSkillsSuccess &&
                _.isEmpty(selfReportedSkills?.skills) && (
                  <DefaultEmptyBox
                    className="w-full"
                    message="You don't have any self-reported skills yet."
                  />
                )}
              {!selfReportedSkillsLoading &&
                selfReportedSkillsSuccess &&
                !_.isEmpty(selfReportedSkills?.skills) &&
                selfReportedSkills?.skills.map((skill: any, index: number) => (
                  <SkillBox
                    key={index}
                    onSkillClick={() => {
                      setSelectedSkill({
                        id: index,
                        name: skill.name || '',
                        level: selfReportedSkills?.data?.level[index] || 0,
                        starred: true,
                        type: 'self-reported',
                      });
                    }}
                    skill={{
                      name: skill.name || '',
                      level: selfReportedSkills?.data?.level?.[index] || 0,
                      starred: true,
                    }}
                  />
                ))}
            </div>
          </div>

          {/* Desktop view - grid layout */}
          {!selfReportedSkillsLoading && selfReportedSkillsError && (
            <DefaultEmptyBox
              className="w-full"
              message="You don't have any self-reported skills yet."
            />
          )}
          {!selfReportedSkillsLoading &&
            selfReportedSkillsSuccess &&
            _.isEmpty(selfReportedSkills?.skills) && (
              <DefaultEmptyBox
                className="w-full"
                message="You don't have any self-reported skills yet."
              />
            )}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {selfReportedSkillsLoading && (
              <SkeletonMultiplier Skeleton={SkeletonSkillBox} multiplier={6} />
            )}

            {!selfReportedSkillsLoading &&
              selfReportedSkillsSuccess &&
              !_.isEmpty(selfReportedSkills?.skills) &&
              selfReportedSkills?.skills.map((skill: any, index: number) => (
                <SkillBox
                  key={index}
                  onSkillClick={() => {
                    setSelectedSkill({
                      id: index,
                      name: skill.name || '',
                      level: selfReportedSkills?.data?.level?.[index] || 0,
                      starred: true,
                      type: 'self-reported',
                    });
                  }}
                  skill={{
                    name: skill.name || '',
                    level: selfReportedSkills?.data?.level?.[index] || 0,
                    starred: true,
                  }}
                />
              ))}
          </div>
        </div>

        {/* Desired Skills Section - Now with a distinct card and background */}
        <div className="bg-gray-50/70 rounded-md p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-700">Desired</h2>
            <div className="flex gap-2 sm:gap-4">
              <div className="sm:hidden flex gap-2 order-2 sm:order-1">
                <button
                  onClick={() =>
                    scrollLeft(desiredSkillsScrollRef as React.RefObject<HTMLDivElement>)
                  }
                  className="w-8 h-8 flex items-center justify-center bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                  aria-label="Previous skills"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    scrollRight(desiredSkillsScrollRef as React.RefObject<HTMLDivElement>)
                  }
                  className="w-8 h-8 flex items-center justify-center bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                  aria-label="Next skills"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={() => handleOpenAddSkillDialog('desired')}
                className="flex items-center gap-1 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] px-3 py-1.5 rounded-md hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add Skill</span>
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-8 bg-white">
            {!desiredSkillsLoading && desiredSkillsError && (
              <DefaultEmptyBox
                className="w-full"
                message="You don't have any desired skills yet."
              />
            )}
            {!desiredSkillsLoading && desiredSkillsSuccess && _.isEmpty(desiredSkills?.skills) && (
              <DefaultEmptyBox
                className="w-full"
                message="You don't have any desired skills yet."
              />
            )}

            {/* Mobile view - horizontal scrolling container */}
            <div ref={desiredSkillsScrollRef} className="sm:hidden overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                {desiredSkillsLoading && (
                  <SkeletonMultiplier Skeleton={SkeletonSkillBox} multiplier={6} />
                )}
                {!desiredSkillsLoading && desiredSkillsError && (
                  <DefaultEmptyBox
                    className="w-full"
                    message="You don't have any desired skills yet."
                  />
                )}
                {!desiredSkillsLoading &&
                  desiredSkillsSuccess &&
                  _.isEmpty(desiredSkills?.skills) && (
                    <DefaultEmptyBox
                      className="w-full"
                      message="You don't have any desired skills yet."
                    />
                  )}
                {!desiredSkillsLoading &&
                  desiredSkillsSuccess &&
                  !_.isEmpty(desiredSkills?.skills) &&
                  desiredSkills?.skills.map((skill: any, index: number) => (
                    <SkillBox
                      key={index}
                      showRating={false}
                      skill={{
                        name: skill.name || '',
                        level: desiredSkills?.data?.level?.[index] || 0,
                        starred: true,
                      }}
                    />
                  ))}
              </div>
            </div>
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {desiredSkillsLoading && (
                <SkeletonMultiplier Skeleton={SkeletonSkillBox} multiplier={6} />
              )}
              {!desiredSkillsLoading &&
                desiredSkillsSuccess &&
                !_.isEmpty(desiredSkills?.skills) &&
                desiredSkills?.skills.map((skill: any, index: number) => (
                  <SkillBox
                    key={index}
                    showRating={false}
                    skill={{
                      name: skill.name || '',
                      level: desiredSkills?.data?.level?.[index] || 0,
                      starred: true,
                    }}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Skill Dialog */}
      <AddSkillDialog
        open={addSkillDialogOpen}
        onOpenChange={setAddSkillDialogOpen}
        type={skillTypeToAdd}
        existingSkills={{
          selfReported: selfReportedSkills,
          desired: desiredSkills,
        }}
      />
      {/* Skill Detail Modal */}
      {selectedSkill && (
        <SkillDetailModal
          skill={{
            name: selectedSkill.name,
            rating: selectedSkill.level || 0,
          }}
          updatingSkill={updatingSkill}
          deletingSkill={deletingSkill}
          onClose={() => setSelectedSkill(null)}
          onRatingChange={(rating) => {
            handleSkillsUpdate(
              {
                ...selectedSkill,
                level: rating,
              },
              {
                selfReported: selfReportedSkills,
                desired: desiredSkills,
              },
              () => {
                setSelectedSkill(null);
              },
            );
          }}
          onDeleteSkill={() => {
            handleSkillsDeletion(
              selectedSkill,
              {
                selfReported: selfReportedSkills,
                desired: desiredSkills,
              },
              () => {
                setSelectedSkill(null);
              },
            );
          }}
          onConfirm={() => {
            // Close the modal
            //setSelectedSkill(null);
          }}
        />
      )}
    </>
  );
}
