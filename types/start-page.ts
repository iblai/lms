import { CatalogRole } from './roles';
import { CatalogSearchSkill } from './skills';

export interface selectedFields {
  roles: CatalogRole[];
  skills: CatalogSearchSkill[];
  resume?: File | null;
  profileImage?: File | null;
  socialLinks: {
    linkedin: string;
    twitter: string;
    facebook: string;
  };
}
