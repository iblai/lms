'use client';

import { useGetUserExperienceQuery } from '@iblai/iblai-js/data-layer';
import { getUserName, getTenant } from '@/utils/helpers';
import { Edit2 } from 'lucide-react';
import { useState } from 'react';
import { DefaultEmptyBox } from '../default-empty-box';
import { SkeletonEducationBox } from './skeleton-education-box';
import { SkeletonMultiplier } from '../skeleton-multiplier';
import { Experience } from '@iblai/iblai-api';
import dayjs from 'dayjs';
import { AddCompanyDialog } from '../add-company-dialog';
import { ExperienceDialog } from '@iblai/iblai-js/web-containers';
export const ExperienceBox = () => {
  const {
    data: experience,
    isLoading,
    error,
  } = useGetUserExperienceQuery([
    {
      org: getTenant(),
      username: getUserName(),
    },
  ]);

  const [editExperienceOpen, setEditExperienceOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | undefined>(undefined);
  const [openAddCompanyDialog, setOpenAddCompanyDialog] = useState(false);
  // Removed unused AppContext destructuring since we're using direct dialogs now

  const handleEditExperience = (experience: Experience) => {
    setSelectedExperience(experience);
    setEditExperienceOpen(true);
  };

  const handleSaveCompany = () => {
    setOpenAddCompanyDialog(false);
  };
  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Work Experience</h2>
        <div className="space-y-8">
          {isLoading && <SkeletonMultiplier multiplier={4} Skeleton={SkeletonEducationBox} />}
          {((!isLoading && error) ||
            (!isLoading && !error && (experience as unknown as Experience[])?.length === 0)) && (
            <DefaultEmptyBox message="No experience found." />
          )}
          {!isLoading &&
            !error &&
            experience &&
            (experience as unknown as Experience[])?.length > 0 &&
            (experience as unknown as Experience[]).map(
              (_experience: Experience, index: number) => (
                <div key={index}>
                  <div className="flex items-center">
                    <h3 className="text-base font-medium text-amber-500">{_experience.title}</h3>
                    <button
                      onClick={() => handleEditExperience(_experience)}
                      className="ml-2 text-amber-500 hover:text-amber-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-1 text-gray-700">
                    {_experience.company?.name} |{' '}
                    {dayjs(_experience.start_date).format('YYYY') ===
                    dayjs(_experience.end_date).format('YYYY')
                      ? dayjs(_experience.end_date).format('YYYY')
                      : `${dayjs(_experience.start_date).format('YYYY')} - ${
                          _experience.end_date
                            ? dayjs(_experience.end_date).format('YYYY')
                            : 'Present'
                        }`}
                  </div>
                  {_experience.description && (
                    <p className="mt-2 text-gray-600">{_experience.description}</p>
                  )}
                </div>
              ),
            )}
        </div>
      </div>
      {editExperienceOpen && (
        <ExperienceDialog
          open={editExperienceOpen}
          onOpenChange={setEditExperienceOpen}
          experience={selectedExperience}
          org={getTenant()}
          username={getUserName()}
          onComplete={() => {
            // Refetch experience data if needed
            setEditExperienceOpen(false);
          }}
        />
      )}
      {openAddCompanyDialog && (
        <AddCompanyDialog
          open={openAddCompanyDialog}
          onOpenChange={setOpenAddCompanyDialog}
          onSave={handleSaveCompany}
        />
      )}
    </>
  );
};
