'use client';

import { motion } from 'framer-motion';
import { Search, Check, X } from 'lucide-react';
import { RATING_LEVELS } from './utils';
import { useStartPage } from '@/hooks/start/use-start-page';
import { useContext, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { SkeletonMultiplier } from '../skeleton-multiplier';
import { SkeletonStartPageSkillsBox } from '../skeleton-start-page-skills-box';
import { CatalogSearchSkill } from '@/types/skills';
import { DefaultEmptyBox } from '../default-empty-box';
import { StartPageContext } from '@/hooks/start/start-page-context';

export default function SkillsSlide() {
  const { fields, handleToggleSkill, isSkillSelected, handleUpdateSkillRating } =
    useContext(StartPageContext);
  const { handleSkillsFetch, skills, skillsLoading } = useStartPage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleFetchAllSkills = useDebouncedCallback(() => {
    handleSkillsFetch({ searchQuery, limit: 12 + fields.skills.length });
  }, 500);

  useEffect(() => {
    handleFetchAllSkills();
  }, [searchQuery]);

  return (
    <motion.div
      key="slide3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-amber-50/50 to-gray-50/30"></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 z-0 h-64 w-64 -translate-x-20 -translate-y-20 rounded-full bg-amber-100/20"></div>

      <div
        className="scrollbar-hide relative z-10 max-h-[70vh] overflow-y-auto p-6 sm:p-8 md:p-12"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <h2 className="mb-6 text-center text-xl font-bold text-gray-600 sm:mb-8 sm:text-2xl">
          Add Skills to Your Profile
        </h2>

        <div className="relative mb-6">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Search className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
          </div>
          <input
            type="text"
            placeholder="Search for a skill"
            className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none sm:py-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <p className="mb-4 text-sm font-medium text-gray-500">
          {fields.skills.length} Selected Skills
        </p>

        <div className="mb-8 flex flex-wrap gap-2 sm:gap-3">
          {skillsLoading && (
            <SkeletonMultiplier multiplier={20} Skeleton={SkeletonStartPageSkillsBox} />
          )}
          {!skillsLoading &&
            skills.length > 0 &&
            [
              ...fields.skills,
              ...skills.filter(
                (skill) =>
                  !fields.skills.some((s: CatalogSearchSkill) => s.data.id === skill.data.id),
              ),
            ].map((skill, index) => (
              <button
                key={index}
                className={`rounded-[5px] px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm ${
                  isSkillSelected(skill)
                    ? 'border border-amber-500 bg-amber-50 text-gray-800'
                    : 'border border-transparent bg-gray-100 text-gray-700 hover:bg-amber-100'
                }`}
                onClick={() => handleToggleSkill(skill)}
              >
                {isSkillSelected(skill) && <Check className="mr-1 inline h-3 w-3" />}
                {skill.data.name}
              </button>
            ))}
        </div>

        {!skillsLoading && skills.length === 0 && (
          <DefaultEmptyBox
            message={`No skills${searchQuery ? ` matching "${searchQuery}"` : ''} found.`}
          />
        )}

        <div className="mt-8">
          <h3 className="mb-4 text-base font-medium text-gray-600 sm:text-lg">
            Self Rate Your Skills
          </h3>

          {fields.skills.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              {/* Table Header - Hidden on mobile */}
              <div className="hidden grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 p-4 sm:grid">
                <div className="col-span-3 text-sm font-medium text-gray-600">Skill</div>
                <div className="col-span-4 text-sm font-medium text-gray-600">Self Rating</div>
                <div className="col-span-3 text-sm font-medium text-gray-600">Source</div>
                <div className="col-span-2 text-right text-sm font-medium text-gray-600">
                  Remove
                </div>
              </div>

              {/* Mobile List View / Desktop Grid View */}
              {fields.skills.map((skill: CatalogSearchSkill, index: number) => {
                //const currentRating = getSkillRating(skill)
                const ratingLabel = skill?.rating
                  ? RATING_LEVELS[skill?.rating as keyof typeof RATING_LEVELS]
                  : 'NOT RATED';

                return (
                  <div
                    key={index}
                    className={`p-4 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4 ${
                      index !== fields.skills.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    {/* Mobile View - List Item */}
                    <div className="flex flex-col sm:hidden">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2 text-gray-400">★</span>
                          <span className="text-sm font-medium text-gray-800">
                            {skill.data?.name}
                          </span>
                        </div>
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => handleToggleSkill(skill)}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mb-2">
                        <div className="mb-1 text-xs font-medium text-gray-500">Self Rating</div>
                        <div className="flex items-center">
                          <div className="flex space-x-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                  skill?.rating === rating
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateSkillRating(skill, rating);
                                }}
                              >
                                {rating}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">{ratingLabel}</div>
                      </div>

                      <div>
                        <div className="mb-1 text-xs font-medium text-gray-500">Source</div>
                        <div className="text-sm text-gray-600">Added Skill</div>
                      </div>
                    </div>

                    {/* Desktop View - Grid Layout */}
                    <div className="hidden items-center sm:col-span-3 sm:flex">
                      <span className="mr-2 text-gray-400">★</span>
                      <span className="text-sm font-medium text-gray-800">{skill.data?.name}</span>
                    </div>

                    <div className="hidden sm:col-span-4 sm:block">
                      <div className="flex items-center">
                        <div className="flex space-x-4">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                skill?.rating === rating
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateSkillRating(skill, rating);
                              }}
                              title={RATING_LEVELS[rating as keyof typeof RATING_LEVELS]}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{ratingLabel}</div>
                    </div>

                    <div className="hidden text-sm text-gray-600 sm:col-span-3 sm:block">
                      Added Skill
                    </div>

                    <div className="hidden text-right sm:col-span-2 sm:block">
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => handleToggleSkill(skill)}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="mb-2 text-sm text-gray-600">No skills selected yet</p>
              <p className="text-xs text-gray-500">Select skills above to rate your proficiency</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
