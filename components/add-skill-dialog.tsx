'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Check } from 'lucide-react';
import { useProfileSkills } from '@/hooks/profile/use-profile-skills';
import { useDebouncedCallback } from 'use-debounce';
import { SkeletonMultiplier } from './skeleton-multiplier';
import { SkeletonAddSkillsLoading } from './skeleton-add-skills-loading';
import { DefaultEmptyBox } from './default-empty-box';
import { DesiredSkill, ReportedSkill, Skill } from '@iblai/iblai-api';

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'earned' | 'desired' | 'self-reported';
  existingSkills: {
    selfReported: ReportedSkill | undefined;
    desired: DesiredSkill | undefined;
  };
}

export function AddSkillDialog({ open, onOpenChange, type, existingSkills }: AddSkillDialogProps) {
  const {
    fetchedSkills,
    handleFetchAllSkills,
    isFetchingSkills,
    isFetchingSkillsError,
    handleSkillsUpdate,
    updatingSkill,
  } = useProfileSkills();
  const [searchQuery, setSearchQuery] = useState('');

  const handleFetch = useDebouncedCallback(handleFetchAllSkills, 500);
  useEffect(() => {
    handleFetch(searchQuery);
  }, [searchQuery]);

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dialog opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedSkill(null);
    }
  }, [open]);

  const handleAddSkill = () => {
    if (updatingSkill) {
      return;
    }
    if (selectedSkill) {
      handleSkillsUpdate(
        {
          name: selectedSkill?.name || '',
          level: 1,
          type: type,
        },
        {
          selfReported: {
            ...existingSkills.selfReported,
            skills: [...(existingSkills.selfReported?.skills || []), selectedSkill],
            data: {
              level: [...(existingSkills.selfReported?.data?.level || []), 1],
            },
          },
          desired: {
            ...existingSkills.desired,
            skills: [...(existingSkills.desired?.skills || []), selectedSkill],
            data: {
              level: [...(existingSkills.desired?.data?.level || []), 1],
            },
          },
        },
        () => {
          onOpenChange(false);
        },
      );
    }
  };

  const handleSkillSelect = (skill: Skill) => {
    setSelectedSkill(skill);
  };

  const getDialogTitle = () => {
    switch (type) {
      case 'earned':
        return 'Add Earned Skill';
      case 'desired':
        return 'Add Desired Skill';
      case 'self-reported':
        return 'Add Self-Reported Skill';
      default:
        return 'Add Skill';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-medium text-gray-600">
              {getDialogTitle()}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6">
          {/* Search input */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
            />
          </div>

          {((!isFetchingSkills && isFetchingSkillsError) ||
            (isFetchingSkills && fetchedSkills.length === 0)) && (
            <DefaultEmptyBox message="No skills found" />
          )}

          {/* Skills list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {isFetchingSkills && (
              <SkeletonMultiplier multiplier={6} Skeleton={SkeletonAddSkillsLoading} />
            )}
            {!isFetchingSkills &&
              !isFetchingSkillsError &&
              fetchedSkills.length > 0 &&
              fetchedSkills.map((skill, index) => (
                <div
                  key={`skill-${index}`}
                  onClick={() => handleSkillSelect(skill?.data)}
                  className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedSkill?.skill_id === skill?.data?.skill_id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">{skill?.data?.name}</span>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      selectedSkill?.skill_id === skill?.data?.skill_id
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {selectedSkill?.skill_id === skill?.data?.skill_id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Footer with action button */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={handleAddSkill}
            disabled={!selectedSkill}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
              selectedSkill
                ? 'bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] hover:opacity-[var(--button-primary-hover-opacity)]'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {updatingSkill ? 'Submitting...' : 'Add Skill'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
