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

/**
 * The learner's skills — Earned / Self-Reported / Desired sections with
 * add + rate + delete flows. Shared by the profile > Skills page and the
 * sidebar Skills dialog.
 */
export function ProfileSkillsContent() {
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
      {/* Search Bar */}
      <div className="relative mb-6 w-64">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-gray-100 py-2 pr-4 pl-10 text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
        />
      </div>

      {/* Earned Skills Section - Now with a distinct card and background */}
      <div className="mb-8 rounded-md border border-gray-200 bg-gray-50 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-700">Earned</h2>
        </div>

        <div className="flex flex-nowrap gap-4 overflow-x-auto">
          {earnedSkillsLoading && <SkeletonMultiplier Skeleton={SkeletonSkillBox} multiplier={6} />}
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
      <div className="mb-8 rounded-md border border-amber-100 bg-amber-50/30 p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-lg font-medium text-gray-700">Self-Reported</h2>
          <div className="flex gap-2 sm:gap-4">
            <div className="order-2 flex gap-2 sm:order-1 sm:hidden">
              <button
                onClick={() => scrollLeft(selfReportedScrollRef as React.RefObject<HTMLDivElement>)}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-white transition-colors hover:bg-amber-600"
                aria-label="Previous skills"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() =>
                  scrollRight(selfReportedScrollRef as React.RefObject<HTMLDivElement>)
                }
                className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-white transition-colors hover:bg-amber-600"
                aria-label="Next skills"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => handleOpenAddSkillDialog('self-reported')}
              className="order-1 flex flex-1 items-center justify-center gap-1 rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-3 py-1.5 text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)] sm:order-2 sm:flex-initial sm:justify-start"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Skill</span>
            </button>
          </div>
        </div>

        {/* Mobile view - horizontal scrolling container */}
        <div ref={selfReportedScrollRef} className="-mx-4 overflow-x-auto px-4 pb-4 sm:hidden">
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
        <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="rounded-md border border-gray-200 bg-gray-50/70 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-700">Desired</h2>
          <div className="flex gap-2 sm:gap-4">
            <div className="order-2 flex gap-2 sm:order-1 sm:hidden">
              <button
                onClick={() =>
                  scrollLeft(desiredSkillsScrollRef as React.RefObject<HTMLDivElement>)
                }
                className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-white transition-colors hover:bg-amber-600"
                aria-label="Previous skills"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() =>
                  scrollRight(desiredSkillsScrollRef as React.RefObject<HTMLDivElement>)
                }
                className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-white transition-colors hover:bg-amber-600"
                aria-label="Next skills"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => handleOpenAddSkillDialog('desired')}
              className="flex items-center gap-1 rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-3 py-1.5 text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Skill</span>
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8">
          {!desiredSkillsLoading && desiredSkillsError && (
            <DefaultEmptyBox className="w-full" message="You don't have any desired skills yet." />
          )}
          {!desiredSkillsLoading && desiredSkillsSuccess && _.isEmpty(desiredSkills?.skills) && (
            <DefaultEmptyBox className="w-full" message="You don't have any desired skills yet." />
          )}

          {/* Mobile view - horizontal scrolling container */}
          <div ref={desiredSkillsScrollRef} className="-mx-4 overflow-x-auto px-4 pb-4 sm:hidden">
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
          <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
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
