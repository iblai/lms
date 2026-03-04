'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Basic understanding of fundamentals; requires significant guidance.',
  2: 'Familiar with core concepts; can complete routine tasks with some supervision.',
  3: 'Capable of managing varied tasks; understands nuances but may seek guidance for complexities.',
  4: 'Proficient with advanced concepts; can work independently on complex tasks.',
  5: 'Expert level mastery; can innovate and teach others in this domain.',
};

interface SkillDetailModalProps {
  skill: {
    name: string;
    rating: number;
  };
  updatingSkill?: boolean;
  deletingSkill?: boolean;
  onClose: () => void;
  onRatingChange?: (rating: number) => void;
  onDeleteSkill?: () => void;
  onConfirm?: () => void;
}

export function SkillDetailModal({
  skill,
  updatingSkill = false,
  deletingSkill = false,
  onClose,
  onRatingChange,
  onDeleteSkill,
}: SkillDetailModalProps) {
  // Store the original rating from props
  const [originalRating] = useState<number>(skill.rating || 1);

  // Temporary rating that changes as user interacts with slider
  const [tempRating, setTempRating] = useState<number>(skill.rating || 1);

  // Reset temp rating when skill changes
  /* useEffect(() => {
    setTempRating(skill.rating || 1)
  }, [skill]) */

  const handleTempRatingChange = (rating: number) => {
    setTempRating(rating);
  };

  const handleConfirm = () => {
    if (updatingSkill) {
      return;
    }
    // Only apply the rating change when confirming
    if (onRatingChange /* && tempRating !== originalRating */) {
      onRatingChange(tempRating);
    }

    /* if (onConfirm) {
      onConfirm()
    } */

    //onClose()
  };

  const handleCancel = () => {
    // Discard changes
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[85vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30">
          <h3 className="text-lg font-medium text-[var(--text)]">
            Rate your expertise in "{skill.name}"
          </h3>
          <button
            onClick={handleCancel}
            className="rounded-full p-1 text-gray-400 hover:bg-[var(--primary-light)] hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="p-6 max-h-[70vh] overflow-y-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* Rating Scale */}
          <div className="mb-8">
            <div className="relative mb-10 pt-3">
              {/* Track background */}
              <div className="h-2 bg-gradient-to-r from-amber-100 to-amber-200 rounded-full"></div>

              {/* Rating markers - positioned at 0%, 25%, 50%, 75%, and 100% */}
              {[1, 2, 3, 4, 5].map((rating) => {
                const position = ((rating - 1) / 4) * 100;
                return (
                  <div
                    key={rating}
                    onClick={() => handleTempRatingChange(rating)}
                    className={`absolute top-3 -mt-1 -ml-2 w-4 h-4 rounded-full border-2 cursor-pointer transition-all duration-200 ${
                      rating <= tempRating
                        ? 'bg-amber-500 border-white'
                        : 'bg-white border-amber-200'
                    }`}
                    style={{ left: `${position}%` }}
                  />
                );
              })}

              {/* Filled track - positioned to match exactly with the current rating dot */}
              <div
                className="absolute top-3 left-0 h-2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-200"
                style={{
                  width:
                    tempRating === 1
                      ? '0%' // For rating 1, don't show any filled track
                      : `${((tempRating - 1) / 4) * 100}%`, // For other ratings, fill to the dot
                }}
              ></div>

              {/* Rating numbers - positioned at the same positions as the markers */}
              {[1, 2, 3, 4, 5].map((rating) => {
                const position = ((rating - 1) / 4) * 100;
                return (
                  <div
                    key={`label-${rating}`}
                    onClick={() => handleTempRatingChange(rating)}
                    className={`absolute top-7 -ml-2 text-center w-4 cursor-pointer transition-all duration-200`}
                    style={{ left: `${position}%` }}
                  >
                    <span
                      className={`text-sm font-medium ${
                        rating === tempRating ? 'text-amber-600' : 'text-gray-500'
                      }`}
                    >
                      {rating}
                    </span>
                  </div>
                );
              })}

              {/* Slider thumb - positioned based on current rating */}
              <div
                className="absolute top-3 -mt-2 -ml-3 w-6 h-6 bg-amber-500 rounded-full border-2 border-white shadow-md transition-all duration-200"
                style={{ left: `${((tempRating - 1) / 4) * 100}%` }}
              ></div>

              {/* Hidden input for accessibility and interaction */}
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={tempRating}
                onChange={(e) => handleTempRatingChange(Number.parseInt(e.target.value))}
                className="absolute top-2 w-full h-4 opacity-0 cursor-pointer z-10"
                style={{ margin: 0, padding: 0 }}
                aria-label="Skill rating"
              />
            </div>

            <div className="flex justify-between mt-4 text-sm font-medium">
              <span className="text-gray-600">Beginner</span>
              <span className="text-amber-600">Level {tempRating}</span>
              <span className="text-gray-600">Expert</span>
            </div>
          </div>

          {/* Rating Circle */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-20 h-20 mb-4">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#F8B43A"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={`${(100 - ((tempRating || 1) / 5) * 100) * 2.512}`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-700">{tempRating}</span>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 max-w-xs">
              {RATING_DESCRIPTIONS[tempRating]}
            </p>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            {onDeleteSkill && (
              <button
                onClick={onDeleteSkill}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {deletingSkill ? 'Deleting...' : 'Delete skill'}
              </button>
            )}
          </div>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] rounded-md text-sm font-medium transition-all ${
              tempRating !== originalRating
                ? 'animate-pulse hover:opacity-[var(--button-primary-hover-opacity)]'
                : 'hover:opacity-[var(--button-primary-hover-opacity)]'
            }`}
          >
            {updatingSkill ? 'Updating...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
