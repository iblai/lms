import { CatalogRole } from '@/types/roles';
import { CatalogSearchSkill } from '@/types/skills';
import { selectedFields } from '@/types/start-page';
import { createContext } from 'react';

export const StartPageContext = createContext<{
  fields: selectedFields;
  setFields: (fields: selectedFields) => void;
  handleToggleRole: (role: CatalogRole) => void;
  isRoleSelected: (role: CatalogRole) => boolean;
  handleToggleSkill: (skill: CatalogSearchSkill) => void;
  isSkillSelected: (skill: CatalogSearchSkill) => boolean;
  handleUpdateSkillRating: (skill: CatalogSearchSkill, rating: number) => void;
  handleProfileImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  profileImage: string | null;
  handleSocialLinksUpdate: ({
    socialType,
    socialLink,
  }: {
    socialType: string;
    socialLink: string;
  }) => void;
  handleFileUpload: (file: File | null) => void;
}>({
  fields: {
    roles: [],
    skills: [],
    resume: null,
    profileImage: null,
    socialLinks: {
      linkedin: '',
      twitter: '',
      facebook: '',
    },
  },
  setFields: () => {},
  handleToggleRole: () => {},
  isRoleSelected: () => false,
  handleToggleSkill: () => {},
  isSkillSelected: () => false,
  handleUpdateSkillRating: () => {},
  handleProfileImageSelect: () => {},
  profileImage: null,
  handleSocialLinksUpdate: () => {},
  handleFileUpload: () => {},
});
