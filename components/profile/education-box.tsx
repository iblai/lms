'use client';

import { Edit2 } from 'lucide-react';
import { useGetUserEducationQuery } from '@iblai/iblai-js/data-layer';
import { getTenant, getUserName } from '@/utils/helpers';
import { SkeletonMultiplier } from '../skeleton-multiplier';
import { SkeletonEducationBox } from './skeleton-education-box';
import { DefaultEmptyBox } from '../default-empty-box';
import { Education } from '@iblai/iblai-api';
import dayjs from 'dayjs';
import { useState } from 'react';
import { AddInstitutionDialog } from '../add-institution-dialog';
import { EducationDialog } from '@iblai/iblai-js/web-containers';
export const EducationBox = () => {
  const {
    data: education,
    isLoading,
    error,
  } = useGetUserEducationQuery([
    {
      org: getTenant(),
      username: getUserName(),
    },
  ]);

  const [editEducationOpen, setEditEducationOpen] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState<Education | undefined>(undefined);
  const [openAddInstitutionDialog, setOpenAddInstitutionDialog] = useState(false);
  // Removed unused AppContext destructuring since we're using direct dialogs now

  const handleEditEducation = (education: Education) => {
    setSelectedEducation(education);
    setEditEducationOpen(true);
  };

  const handleSaveInstitution = () => {
    setOpenAddInstitutionDialog(false);
  };
  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Education</h2>
        <div className="space-y-8">
          {isLoading && <SkeletonMultiplier multiplier={4} Skeleton={SkeletonEducationBox} />}
          {((!isLoading && error) ||
            (!isLoading && !error && (education as unknown as Education[])?.length === 0)) && (
            <DefaultEmptyBox message="No education found." />
          )}
          {!isLoading &&
            !error &&
            education &&
            (education as unknown as Education[])?.length > 0 &&
            (education as unknown as Education[]).map((_education: Education, index: number) => (
              <div key={index}>
                <div className="flex items-center">
                  <h3 className="text-base font-medium text-amber-500">{_education.degree}</h3>
                  <button
                    onClick={() => handleEditEducation(_education)}
                    className="ml-2 text-amber-500 hover:text-amber-600 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-1 text-gray-700">
                  {_education?.institution?.name} |
                  {dayjs(_education.start_date).format('YYYY') ===
                  dayjs(_education.end_date).format('YYYY')
                    ? dayjs(_education.end_date).format('YYYY')
                    : `${dayjs(_education.start_date).format('YYYY')} - ${
                        _education.end_date ? dayjs(_education.end_date).format('YYYY') : 'Present'
                      }`}
                  | Grade: {_education.grade}
                </div>
                {_education.description && (
                  <p className="mt-2 text-gray-600">{_education.description}</p>
                )}
              </div>
            ))}
        </div>
      </div>
      {editEducationOpen && (
        <EducationDialog
          open={editEducationOpen}
          onOpenChange={setEditEducationOpen}
          education={selectedEducation}
          org={getTenant()}
          username={getUserName()}
          onComplete={() => {
            // Refetch education data if needed
            setEditEducationOpen(false);
          }}
        />
      )}
      {openAddInstitutionDialog && (
        <AddInstitutionDialog
          open={openAddInstitutionDialog}
          onOpenChange={setOpenAddInstitutionDialog}
          // @ts-expect-error - investigate
          onSave={handleSaveInstitution}
        />
      )}
    </>
  );
};
