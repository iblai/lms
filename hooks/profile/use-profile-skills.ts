import { UserSkill } from '@/types/skills';
import { getTenant, getUserId, getUserName } from '@/utils/helpers';
import {
  useGetUserEarnedSkillsQuery,
  useGetUserReportedSkillsQuery,
  useGetUserDesiredSkillsQuery,
  useCreateOrUpdateUserReportedSkillMutation,
  useCreateOrUpdateUserDesiredSkillMutation,
} from '@iblai/iblai-js/data-layer';
import { ReportedSkill, DesiredSkill } from '@iblai/iblai-api';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCatalogSearch } from '../search/use-catalog-search';
export const useProfileSkills = (showToast: boolean = true) => {
  const {
    data: earnedSkills,
    isLoading: earnedSkillsLoading,
    isError: earnedSkillsError,
    isSuccess: earnedSkillsSuccess,
  } = useGetUserEarnedSkillsQuery([
    {
      org: getTenant(),
      // @ts-expect-error // userId may not be part of useGetUserEarnedSkillsQuery Query definition
      userId: getUserName(),
    },
  ]);

  const {
    data: selfReportedSkills,
    isLoading: selfReportedSkillsLoading,
    isError: selfReportedSkillsError,
    isSuccess: selfReportedSkillsSuccess,
  } = useGetUserReportedSkillsQuery([
    {
      userId: getUserId(),
      username: getUserName(),
    },
  ]);

  const {
    data: desiredSkills,
    isLoading: desiredSkillsLoading,
    isError: desiredSkillsError,
    isSuccess: desiredSkillsSuccess,
  } = useGetUserDesiredSkillsQuery([
    {
      userId: getUserId(),
      username: getUserName(),
    },
  ]);

  const {
    handleSearch,
    isLoading: isFetchingSkills,
    isError: isFetchingSkillsError,
  } = useCatalogSearch();

  const [updatingSkill, setUpdatingSkill] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState(false);
  const [fetchedSkills, setFetchedSkills] = useState<any[]>([]);

  const handleFetchAllSkills = async (searchQuery?: string) => {
    try {
      const skills = await handleSearch({
        content: ['skills'],
        tenant: getTenant(),
        ...(searchQuery && { query: searchQuery }),
      });
      if (isFetchingSkillsError) {
        throw new Error('Failed to fetch skills');
      }
      setFetchedSkills(skills?.data?.results || []);
    } catch (error) {
      toast.error('Failed to fetch skills');
      setFetchedSkills([]);
    }
  };

  const [createOrUpdateUserReportedSkill, { isError: isCreatingOrUpdateUserReportedSkillError }] =
    useCreateOrUpdateUserReportedSkillMutation();
  const [createOrUpdateUserDesiredSkill, { isError: isCreatingOrUpdateUserDesiredSkillError }] =
    useCreateOrUpdateUserDesiredSkillMutation();
  const handleSkillsDeletion = async (
    skill: Partial<UserSkill>,
    allSkills: {
      selfReported: ReportedSkill | undefined;
      desired: DesiredSkill | undefined;
    },
    callback?: () => void,
  ) => {
    setDeletingSkill(true);
    switch (skill.type) {
      case 'self-reported':
        const reportedSkillIndex = allSkills.selfReported?.skills.findIndex(
          (s) => s.name === skill.name,
        );
        const updatedReportedLevel = allSkills.selfReported?.data.level.filter(
          (_: number, index: number) => index !== reportedSkillIndex,
        );
        await createOrUpdateUserReportedSkill([
          {
            requestBody: {
              skills: allSkills.selfReported?.skills.filter((s) => s.name !== skill.name) || [],
              data: {
                level: updatedReportedLevel,
              },
              user_id: getUserId(),
              username: getUserName(),
            },
          },
        ]);
        if (isCreatingOrUpdateUserReportedSkillError) {
          toast.error('Failed to delete skill');
          return;
        }
        toast.success('Skill deleted successfully');
        setTimeout(() => {
          setDeletingSkill(false);
          callback?.();
        }, 1000);
        break;
      case 'desired':
        const desiredSkillIndex = allSkills.desired?.skills.findIndex((s) => s.name === skill.name);
        const updatedDesiredLevel = allSkills.desired?.data.level.filter(
          (_: number, index: number) => index !== desiredSkillIndex,
        );
        await createOrUpdateUserDesiredSkill([
          {
            requestBody: {
              skills: allSkills.desired?.skills.filter((s) => s.name !== skill.name) || [],
              data: {
                level: updatedDesiredLevel,
              },
              user_id: getUserId(),
              username: getUserName(),
            },
          },
        ]);
        if (isCreatingOrUpdateUserDesiredSkillError) {
          toast.error('Failed to delete skill');
          return;
        }
        toast.success('Skill deleted successfully');
        setTimeout(() => {
          setDeletingSkill(false);
          callback?.();
        }, 1000);
        break;
      default:
        break;
    }
  };

  const handleSkillsUpdate = async (
    skill: Partial<UserSkill>,
    allSkills: {
      selfReported: ReportedSkill | undefined;
      desired: DesiredSkill | undefined;
    },
    callback?: () => void,
  ) => {
    setUpdatingSkill(true);
    switch (skill.type) {
      case 'self-reported':
        const reportedSkillIndex = allSkills.selfReported?.skills.findIndex(
          (s) => s.name === skill.name,
        );
        let updatedReportedLevel = [...(allSkills.selfReported?.data.level ?? [])];
        if (reportedSkillIndex !== undefined && reportedSkillIndex > -1) {
          updatedReportedLevel[reportedSkillIndex] = skill.level;
        }
        await createOrUpdateUserReportedSkill([
          {
            requestBody: {
              skills: allSkills.selfReported?.skills || [],
              data: {
                level: updatedReportedLevel,
              },
              user_id: getUserId(),
              username: getUserName(),
            },
          },
        ]);
        if (isCreatingOrUpdateUserReportedSkillError) {
          toast.error('Failed to update skill');
          return;
        }
        toast.success('Skill updated successfully');
        setTimeout(() => {
          setUpdatingSkill(false);
          callback?.();
        }, 1000);
        break;
      case 'desired':
        const desiredSkillIndex = allSkills.desired?.skills.findIndex((s) => s.name === skill.name);
        let updatedDesiredLevel = [...(allSkills.desired?.data.level ?? [])];
        if (desiredSkillIndex !== undefined && desiredSkillIndex > -1) {
          updatedDesiredLevel[desiredSkillIndex] = skill.level;
        }
        await createOrUpdateUserDesiredSkill([
          {
            requestBody: {
              skills: allSkills.desired?.skills || [],
              data: {
                level: updatedDesiredLevel,
              },
              user_id: getUserId(),
              username: getUserName(),
            },
          },
        ]);
        if (isCreatingOrUpdateUserDesiredSkillError) {
          toast.error('Failed to update skill');
          return;
        }
        toast.success('Skill updated successfully');
        setTimeout(() => {
          setUpdatingSkill(false);
          callback?.();
        }, 1000);
        break;
      default:
        break;
    }
  };

  const handleSkillsCreate = async (skills: ReportedSkill) => {
    try {
      await createOrUpdateUserReportedSkill([
        {
          requestBody: skills,
          userId: getUserId(),
          username: getUserName(),
        },
      ]);
      if (isCreatingOrUpdateUserReportedSkillError) {
        throw new Error('Failed to create skills');
      }
      if (showToast) {
        toast.success('Skills created successfully');
      }
      return true;
    } catch (error) {
      toast.error('Failed to create skills');
      return false;
    }
  };

  return {
    earnedSkills,
    earnedSkillsLoading,
    earnedSkillsError,
    earnedSkillsSuccess,
    selfReportedSkills,
    selfReportedSkillsLoading,
    selfReportedSkillsError,
    selfReportedSkillsSuccess,
    desiredSkills,
    desiredSkillsLoading,
    desiredSkillsError,
    desiredSkillsSuccess,
    handleSkillsDeletion,
    updatingSkill,
    deletingSkill,
    setUpdatingSkill,
    handleSkillsUpdate,
    handleSkillsCreate,
    handleFetchAllSkills,
    fetchedSkills,
    isFetchingSkills,
    isFetchingSkillsError,
  };
};
