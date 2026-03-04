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
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-gray-50/30 z-0"></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100/20 rounded-full -translate-x-20 -translate-y-20 z-0"></div>

      <div
        className="relative z-10 p-6 sm:p-8 md:p-12 max-h-[70vh] overflow-y-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-600 text-center mb-6 sm:mb-8">
          Add Skills to Your Profile
        </h2>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for a skill"
            className="w-full pl-10 pr-4 py-2 sm:py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <p className="text-sm font-medium text-gray-500 mb-4">
          {fields.skills.length} Selected Skills
        </p>

        <div className="flex flex-wrap gap-2 sm:gap-3 mb-8">
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
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-[5px] text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isSkillSelected(skill)
                    ? 'border border-amber-500 bg-amber-50 text-gray-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-amber-100 border border-transparent'
                }`}
                onClick={() => handleToggleSkill(skill)}
              >
                {isSkillSelected(skill) && <Check className="h-3 w-3 inline mr-1" />}
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
          <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-4">
            Self Rate Your Skills
          </h3>

          {fields.skills.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {/* Table Header - Hidden on mobile */}
              <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50">
                <div className="col-span-3 text-sm font-medium text-gray-600">Skill</div>
                <div className="col-span-4 text-sm font-medium text-gray-600">Self Rating</div>
                <div className="col-span-3 text-sm font-medium text-gray-600">Source</div>
                <div className="col-span-2 text-sm font-medium text-gray-600 text-right">
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
                    className={`sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center p-4 ${
                      index !== fields.skills.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    {/* Mobile View - List Item */}
                    <div className="flex flex-col sm:hidden">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <span className="text-gray-400 mr-2">★</span>
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
                        <div className="text-xs font-medium text-gray-500 mb-1">Self Rating</div>
                        <div className="flex items-center">
                          <div className="flex space-x-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${
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
                        <div className="text-xs text-gray-500 mt-1">{ratingLabel}</div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Source</div>
                        <div className="text-sm text-gray-600">Added Skill</div>
                      </div>
                    </div>

                    {/* Desktop View - Grid Layout */}
                    <div className="hidden sm:flex sm:col-span-3 items-center">
                      <span className="text-gray-400 mr-2">★</span>
                      <span className="text-sm font-medium text-gray-800">{skill.data?.name}</span>
                    </div>

                    <div className="hidden sm:block sm:col-span-4">
                      <div className="flex items-center">
                        <div className="flex space-x-4">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
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
                      <div className="text-xs text-gray-500 mt-1">{ratingLabel}</div>
                    </div>

                    <div className="hidden sm:block sm:col-span-3 text-sm text-gray-600">
                      Added Skill
                    </div>

                    <div className="hidden sm:block sm:col-span-2 text-right">
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
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-center">
              <p className="text-sm text-gray-600 mb-2">No skills selected yet</p>
              <p className="text-xs text-gray-500">Select skills above to rate your proficiency</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
