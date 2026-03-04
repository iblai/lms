'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useGetUserEducationQuery, useGetUserExperienceQuery } from '@iblai/iblai-js/data-layer';
import { getTenant, getUserName } from '@/utils/helpers';
import { EditEducationDialog } from './edit-education-dialog';
import { AddInstitutionDialog } from './add-institution-dialog';
import { AddCompanyDialog } from './add-company-dialog';
import { EditExperienceDialog } from './edit-experience-dialog';
import { Education, Experience } from '@iblai/iblai-api';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { data: educations } = useGetUserEducationQuery([
    {
      org: getTenant(),
      username: getUserName(),
    },
  ]);

  const { data: experiences } = useGetUserExperienceQuery([
    {
      org: getTenant(),
      username: getUserName(),
    },
  ]);

  const [experience, setExperience] = useState<string>('Loading...');
  const [education, setEducation] = useState<string>('Loading...');
  const [editEducationOpen, setEditEducationOpen] = useState(false);
  const [openAddInstitutionDialog, setOpenAddInstitutionDialog] = useState(false);
  const [openAddCompanyDialog, setOpenAddCompanyDialog] = useState(false);
  const [editExperienceOpen, setEditExperienceOpen] = useState(false);

  const handleFetchLatestEducation = () => {
    if (!educations) {
      setEducation('No education found');
      return;
    }
    try {
      const currentEducation = (educations as unknown as Education[])
        .filter((edu) => edu.is_current)
        .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime())[0];
      const recentlyEndedEducation = (educations as unknown as Education[])
        .filter((edu) => !edu.is_current && edu.end_date)
        .sort((a, b) => new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime())[0];
      const education = currentEducation || recentlyEndedEducation;
      setEducation(`${education.degree} | ${education.institution.name}`);
    } catch {
      setEducation('No education found');
    }
  };

  const handleFetchLatestExperience = () => {
    if (!experiences) {
      setExperience('No experience found');
      return;
    }
    try {
      const currentExperience = (experiences as unknown as Experience[])
        .filter((exp) => exp.is_current)
        .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime())[0];
      const recentlyEndedExperience = (experiences as unknown as Experience[])
        .filter((exp) => !exp.is_current && exp.end_date)
        .sort((a, b) => new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime())[0];
      const experience = currentExperience || recentlyEndedExperience;
      setExperience(`${experience.title} | ${experience.company.name}`);
    } catch {
      setExperience('No experience found');
    }
  };

  // Reset state when dialog opens with initialInfo
  useEffect(() => {
    handleFetchLatestEducation();
  }, [educations, handleFetchLatestEducation]);

  useEffect(() => {
    handleFetchLatestExperience();
  }, [experiences]);

  const handleSaveEducation = () => {
    setEditEducationOpen(false);
  };
  const handleSaveExperience = () => {
    setEditExperienceOpen(false);
  };

  const handleSaveInstitution = () => {
    setOpenAddInstitutionDialog(false);
  };
  const handleSaveCompany = () => {
    setOpenAddCompanyDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 overflow-hidden max-w-md">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-medium text-gray-800">
              Edit Profile Information
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Current Position Section */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-700">Current Position</h3>
              <input
                type="text"
                value={experience}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-md text-gray-700"
                placeholder="Institution name"
                disabled={true}
                readOnly={true}
              />
              <button
                onClick={() => setEditExperienceOpen(true)}
                className="flex items-center gap-2 text-amber-500 hover:text-amber-600 font-medium text-sm"
              >
                <Plus className="h-4 w-4" />
                Add new position
              </button>
            </div>

            {/* Education Section */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-700">Education</h3>
              <input
                type="text"
                value={education}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-md text-gray-700"
                placeholder="Institution name"
                disabled={true}
                readOnly={true}
              />
              <button
                onClick={() => setEditEducationOpen(true)}
                className="flex items-center gap-2 text-amber-500 hover:text-amber-600 font-medium text-sm"
              >
                <Plus className="h-4 w-4" />
                Add new education
              </button>
            </div>
          </div>

          <div className="border-t p-4 flex justify-end space-x-3">
            <button
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 border border-amber-500 rounded-md text-amber-500 font-medium transition-colors hover:bg-amber-50"
            >
              Close
            </button>
            {/* <button
            onClick={handleSave}
            className="px-8 py-2 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] rounded-md font-medium hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity"
          >
            Save
          </button> */}
          </div>
        </DialogContent>
      </Dialog>
      {editExperienceOpen && (
        <EditExperienceDialog
          open={editExperienceOpen}
          onOpenChange={setEditExperienceOpen}
          onSave={handleSaveExperience}
          setOpenAddCompanyDialog={setOpenAddCompanyDialog}
        />
      )}
      {editEducationOpen && (
        <EditEducationDialog
          open={editEducationOpen}
          onOpenChange={setEditEducationOpen}
          onSave={handleSaveEducation}
          setOpenAddInstitutionDialog={setOpenAddInstitutionDialog}
        />
      )}
      {openAddCompanyDialog && (
        <AddCompanyDialog
          open={openAddCompanyDialog}
          onOpenChange={setOpenAddCompanyDialog}
          onSave={handleSaveCompany}
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
}
