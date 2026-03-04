import { useState } from 'react';
import { useCatalogSearch } from '../search/use-catalog-search';
import { CatalogRole } from '@/types/roles';
import { CatalogSearchSkill } from '@/types/skills';
import { selectedFields } from '@/types/start-page';
import { getTenant, getUserId, getUserName } from '@/utils/helpers';
import { useProfileRoles } from '../profile/use-profile-roles';
import { useProfileSkills } from '../profile/use-profile-skills';
import {
  useGetUserMetadataQuery,
  useLazyGetReportedSkillsQuery,
  UserProfile,
  useUpdateUserMetadataMutation,
} from '@iblai/iblai-js/data-layer';
import { ReportedSkill, Skill } from '@iblai/iblai-api';
import { useUploadProfileImageMutation } from '@/services/users';
import { useCreateUserResumeMutation } from '@/services/career';
import { useRouter } from 'next/navigation';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

export const useStartPage = () => {
  const { metadata } = useTenantMetadata({
    org: getTenant(),
  });
  const router = useRouter();
  const { data: userMetadata } = useGetUserMetadataQuery({
    params: {
      username: getUserName(),
    },
  });
  const canShowSkillsToast = metadata?.enable_skills_screen_on_start_page !== false;
  const canShowRolesToast = metadata?.enable_roles_screen_on_start_page !== false;
  const [, { reset: resetReportedSkills }] = useLazyGetReportedSkillsQuery();
  const { handleSearch, isLoading } = useCatalogSearch();
  const { handleDesiredRolesCreate } = useProfileRoles(canShowRolesToast);
  const { handleSkillsCreate } = useProfileSkills(canShowSkillsToast);
  const [updateUserMetadata] = useUpdateUserMetadataMutation();
  const [uploadProfileImage] = useUploadProfileImageMutation();
  const [createUserResume] = useCreateUserResumeMutation();
  const defaultFields: selectedFields = {
    roles: [],
    skills: [],
    resume: null,
    profileImage: null,
    socialLinks: {
      linkedin: '',
      twitter: '',
      facebook: '',
    },
  };
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [fields, setFields] = useState<selectedFields>(defaultFields);
  const [roles, setRoles] = useState<CatalogRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState<boolean>(false);
  const [skills, setSkills] = useState<CatalogSearchSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState<boolean>(false);
  const handleToggleRole = (role: CatalogRole) => {
    setFields((prevFields) => {
      const isSelected = prevFields.roles.some((r: CatalogRole) => r.data.id === role.data.id);
      return isSelected
        ? {
            ...prevFields,
            roles: prevFields.roles.filter((r: CatalogRole) => r.data.id !== role.data.id),
          }
        : {
            ...prevFields,
            roles: [...prevFields.roles, role],
          };
    });
  };

  const isRoleSelected = (role: CatalogRole) => {
    return fields.roles.some((r: CatalogRole) => r.data.id === role.data.id) || false;
  };

  const handleRolesFetch = async ({
    searchQuery = '',
    limit = 12,
  }: {
    searchQuery?: string;
    limit?: number;
  }) => {
    setRolesLoading(true);
    const roles = await handleSearch({
      content: ['roles'],
      limit,
      tenant: getTenant(),
      ...(searchQuery && { query: searchQuery }),
    });
    setRoles((roles?.data?.results || []) as CatalogRole[]);
    setRolesLoading(false);
  };

  const handleSkillsFetch = async ({
    searchQuery = '',
    limit = 12,
  }: {
    searchQuery?: string;
    limit?: number;
  }) => {
    setSkillsLoading(true);
    const skills = await handleSearch({
      content: ['skills'],
      limit,
      tenant: getTenant(),
      ...(searchQuery && { query: searchQuery }),
    });
    setSkills((skills?.data?.results || []) as CatalogSearchSkill[]);
    setSkillsLoading(false);
  };

  const isSkillSelected = (skill: CatalogSearchSkill) => {
    return fields.skills.some((s: CatalogSearchSkill) => s.data.id === skill.data.id) || false;
  };

  const handleToggleSkill = (skill: CatalogSearchSkill) => {
    setFields((prevFields) => {
      const isSelected = prevFields.skills.some(
        (s: CatalogSearchSkill) => s.data.id === skill.data.id,
      );
      return isSelected
        ? {
            ...prevFields,
            skills: prevFields.skills.filter(
              (s: CatalogSearchSkill) => s.data.id !== skill.data.id,
            ),
          }
        : {
            ...prevFields,
            skills: [...prevFields.skills, skill],
          };
    });
  };

  const handleUpdateSkillRating = (skill: CatalogSearchSkill, rating: number) => {
    setFields((prevFields) => {
      return {
        ...prevFields,
        skills: prevFields.skills.map((s: CatalogSearchSkill) =>
          s.data.id === skill.data.id ? { ...s, rating } : s,
        ),
      };
    });
  };

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Check if file is an image
      if (!files[0].type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      if (files[0].size > 2097152) {
        alert('Image size exceeds 2MB limit');
        return;
      }

      // Create a URL for the image
      const imageUrl = URL.createObjectURL(files[0]);
      setFields((prevFields) => {
        return {
          ...prevFields,
          profileImage: files[0],
        };
      });
      setProfileImage(imageUrl);
    }
  };

  const handleSocialLinksUpdate = ({
    socialType,
    socialLink,
  }: {
    socialType: string;
    socialLink: string;
  }) => {
    setFields((prevFields) => {
      return {
        ...prevFields,
        socialLinks: {
          ...prevFields.socialLinks,
          [socialType]: socialLink || '',
        },
      };
    });
  };

  const handleSubmit = async () => {
    const desiredRoles = {
      roles: fields.roles.map((role) => ({
        name: role.data.name,
      })),
      user_id: getUserId(),
    };

    const reportedSkills = {
      skills: fields.skills.map((skill) => ({
        ...skill.data,
        skill_id: skill.data.id,
      })) as Partial<Skill[]>,
      data: {
        level: fields.skills.map((skill) => skill.rating),
      },
      user_id: getUserId(),
    };

    const socialLinks = Object.entries(fields.socialLinks).map(([key, value]) => ({
      platform: key,
      social_link: value,
    }));
    const bio = fields.roles.map((role) => role.data.name).join('| ');
    const userMetadataUpdate = {
      bio,
      about: userMetadata?.about || '',
      public_metadata: {
        ...userMetadata?.public_metadata,
        bio,
        about: userMetadata?.about || '',
        social_links: socialLinks,
      },
      social_links: socialLinks,
      username: getUserName(),
    };
    const submissionList = [
      handleDesiredRolesCreate(desiredRoles),
      handleSkillsCreate(reportedSkills as ReportedSkill),
      updateUserMetadata(userMetadataUpdate as unknown as UserProfile),
    ];
    if (fields.profileImage) {
      const formData = new FormData();
      formData.append('file', fields.profileImage as File);
      submissionList.push(
        uploadProfileImage({
          formData,
          username: getUserName(),
        }) as unknown as Promise<any>,
      );
    }
    if (fields.resume) {
      const formData = new FormData();
      formData.append('resume', fields.resume as File);
      formData.append('user', getUserName());
      formData.append('platform', getTenant());
      submissionList.push(
        createUserResume({
          username: getUserName(),
          platform_key: getTenant(),
          resume: formData,
          method: 'POST',
        }) as unknown as Promise<any>,
      );
    }
    const submissionPromise = Promise.all(submissionList);
    try {
      const result = await submissionPromise;
      if (!(result[0] && result[1])) {
        throw new Error('Failed to update your roles and skills. Please try again.');
      }
      resetReportedSkills();
      router.push('/home');
    } catch (error) {}
  };

  const handleResumeSelect = (file: File | null) => {
    setFields((prevFields) => {
      return {
        ...prevFields,
        resume: file,
      };
    });
  };

  return {
    handleRolesFetch,
    handleToggleRole,
    isRoleSelected,
    fields,
    setFields,
    roles,
    rolesLoading: rolesLoading || isLoading,
    handleSkillsFetch,
    handleToggleSkill,
    isSkillSelected,
    skills,
    skillsLoading: skillsLoading || isLoading,
    handleUpdateSkillRating,
    handleProfileImageSelect,
    profileImage,
    handleSocialLinksUpdate,
    handleResumeSelect,
    handleSubmit,
  };
};
